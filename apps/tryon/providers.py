import asyncio
import base64
import io
import os
from typing import Protocol

import httpx
from PIL import Image


class TryOnProvider(Protocol):
    async def run(self, person: Image.Image, garment: Image.Image, category: str) -> Image.Image: ...


class MockProvider:
    """Development only: pastes the garment over the torso/legs area so the pipeline can be tested end to end."""

    async def run(self, person: Image.Image, garment: Image.Image, category: str) -> Image.Image:
        w, h = person.size
        box = {
            "upper": (0.18, 0.18, 0.82, 0.55),
            "lower": (0.22, 0.5, 0.78, 0.98),
            "dress": (0.15, 0.18, 0.85, 0.85),
        }[category]
        x0, y0, x1, y1 = int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)
        g = garment.resize((max(1, x1 - x0), max(1, y1 - y0)))
        out = person.convert("RGBA")
        out.alpha_composite(g, (x0, y0))
        return out.convert("RGB")


class FalProvider:
    """Hosted try-on through fal's queue API. Model id is configurable so models can be swapped without code changes.
    Verify the input field names and output shape on the model's fal page at build time; the defaults below are for
    fal-ai/kling/v1-5/kolors-virtual-try-on (human_image_url, garment_image_url -> image.url)."""

    def __init__(self) -> None:
        self.key = os.environ["FAL_KEY"]
        self.model = os.environ.get("FAL_MODEL", "fal-ai/kling/v1-5/kolors-virtual-try-on")

    @staticmethod
    def _data_uri(img: Image.Image, fmt: str = "JPEG") -> str:
        buf = io.BytesIO()
        img.convert("RGB").save(buf, fmt, quality=92)
        return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()

    async def run(self, person: Image.Image, garment: Image.Image, category: str) -> Image.Image:
        headers = {"Authorization": f"Key {self.key}", "Content-Type": "application/json"}
        body = {
            "human_image_url": self._data_uri(person),
            "garment_image_url": self._data_uri(garment.convert("RGB")),
        }
        async with httpx.AsyncClient(timeout=30) as c:
            sub = await c.post(f"https://queue.fal.run/{self.model}", headers=headers, json=body)
            sub.raise_for_status()
            job = sub.json()
            for _ in range(60):  # up to ~90 s
                st = (await c.get(job["status_url"], headers=headers)).json()
                if st.get("status") == "COMPLETED":
                    break
                if st.get("status") in ("FAILED", "CANCELLED"):
                    raise RuntimeError("fal try-on failed")
                await asyncio.sleep(1.5)
            else:
                raise RuntimeError("fal try-on timed out")
            out = (await c.get(job["response_url"], headers=headers)).json()
            img = await c.get(out["image"]["url"])
            img.raise_for_status()
        return Image.open(io.BytesIO(img.content)).convert("RGB")


def get_provider() -> TryOnProvider:
    name = os.environ.get("TRYON_PROVIDER", "mock")
    if name == "mock":
        return MockProvider()
    if name == "fal":
        return FalProvider()
    raise RuntimeError(f"Provider '{name}' is not configured.")
