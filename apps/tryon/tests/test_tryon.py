import io
import os
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

os.environ.setdefault("TRYON_TOKEN", "test-secret-token")
os.environ.setdefault("TRYON_PROVIDER", "mock")
os.environ.setdefault("ALLOWED_GARMENT_HOSTS", "127.0.0.1,localhost")

from main import app  # noqa: E402

client = TestClient(app)


def make_png_bytes(w: int = 480, h: int = 720, color: tuple[int, int, int] = (140, 140, 140), textured: bool = True) -> bytes:
    im = Image.new("RGB", (w, h), color)
    if textured:
        draw = ImageDraw.Draw(im)
        draw.rectangle([100, 100, w - 100, h - 100], outline=(20, 20, 20), width=6)
        draw.line([0, 0, w, h], fill=(240, 240, 240), width=4)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_wrong_token_returns_401():
    r = client.post(
        "/v1/tryon",
        headers={"Authorization": "Bearer wrong-token"},
        files={"person": ("p.png", make_png_bytes(), "image/png")},
        data={"garment_url": "http://127.0.0.1:9000/garment.png", "category": "upper"},
    )
    assert r.status_code == 401


def test_disallowed_host_returns_400():
    token = os.environ["TRYON_TOKEN"]
    r = client.post(
        "/v1/tryon",
        headers={"Authorization": f"Bearer {token}"},
        files={"person": ("p.png", make_png_bytes(), "image/png")},
        data={"garment_url": "https://evil.example.com/garment.png", "category": "upper"},
    )
    assert r.status_code == 400


def test_non_image_returns_415():
    token = os.environ["TRYON_TOKEN"]
    r = client.post(
        "/v1/tryon",
        headers={"Authorization": f"Bearer {token}"},
        files={"person": ("not-an-image.txt", b"hello world", "text/plain")},
        data={"garment_url": "http://127.0.0.1:9000/garment.png", "category": "upper"},
    )
    assert r.status_code == 415


def test_mock_provider_returns_png_of_person_size():
    token = os.environ["TRYON_TOKEN"]
    garment_bytes = make_png_bytes(200, 200, (200, 50, 50))
    person_bytes = make_png_bytes(480, 720)

    with patch("main.fetch", new=AsyncMock(return_value=garment_bytes)):
        r = client.post(
            "/v1/tryon",
            headers={"Authorization": f"Bearer {token}"},
            files={"person": ("p.png", person_bytes, "image/png")},
            data={"garment_url": "http://127.0.0.1:9000/garment.png", "category": "upper"},
        )

    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    out = Image.open(io.BytesIO(r.content))
    assert out.size == (480, 720)


def test_validate_photo_rejects_small_and_dark_and_accepts_valid():
    token = os.environ["TRYON_TOKEN"]

    # Too small
    r_small = client.post(
        "/v1/validate-photo",
        headers={"Authorization": f"Bearer {token}"},
        files={"person": ("small.png", make_png_bytes(200, 300), "image/png")},
    )
    assert r_small.status_code == 422

    # Too dark
    r_dark = client.post(
        "/v1/validate-photo",
        headers={"Authorization": f"Bearer {token}"},
        files={"person": ("dark.png", make_png_bytes(480, 720, (2, 2, 2), textured=False), "image/png")},
    )
    assert r_dark.status_code == 422

    # Valid
    r_ok = client.post(
        "/v1/validate-photo",
        headers={"Authorization": f"Bearer {token}"},
        files={"person": ("ok.png", make_png_bytes(480, 720), "image/png")},
    )
    assert r_ok.status_code == 200
    assert r_ok.json()["ok"] is True
