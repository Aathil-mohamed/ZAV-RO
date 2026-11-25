import io
import os
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, ImageFilter, ImageOps, ImageStat

from providers import get_provider

load_dotenv()

app = FastAPI(title="ZAVÉRO Try-On Service", version="0.2.0")

MAX_BYTES = 10 * 1024 * 1024


def _token() -> str:
    return os.environ["TRYON_TOKEN"]


def _allowed_hosts() -> set[str]:
    return {h.strip() for h in os.environ.get("ALLOWED_GARMENT_HOSTS", "").split(",") if h.strip()}


@app.get("/health")
def health():
    return {"ok": True}


def check_url(url: str) -> None:
    host = urlparse(url).hostname or ""
    if host not in _allowed_hosts():
        raise HTTPException(400, "Garment host not allowed")


async def fetch(url: str) -> bytes:
    check_url(url)
    async with httpx.AsyncClient(timeout=15, follow_redirects=False) as c:
        r = await c.get(url)
    if r.status_code != 200 or len(r.content) > MAX_BYTES:
        raise HTTPException(400, "Could not load garment image")
    return r.content


def clean(b: bytes) -> Image.Image:
    try:
        im = Image.open(io.BytesIO(b))
        im = ImageOps.exif_transpose(im).convert("RGB")  # fixes phone rotation, strips EXIF
    except Exception:
        raise HTTPException(415, "Unsupported image")
    im.thumbnail((1024, 1536))
    return im


@app.post("/v1/validate-photo")
async def validate_photo(person: UploadFile = File(...), authorization: str = Header("")):
    if authorization != f"Bearer {_token()}":
        raise HTTPException(401, "Unauthorized")
    pb = await person.read()
    if len(pb) > MAX_BYTES:
        raise HTTPException(413, "Photo too large")
    try:
        im = Image.open(io.BytesIO(pb))
        im = ImageOps.exif_transpose(im).convert("RGB")
    except Exception:
        raise HTTPException(415, "Unsupported image")

    w, h = im.size
    if w < 400 or h < 600:
        raise HTTPException(422, "Photo must be at least 400x600 pixels.")

    gray = im.convert("L")
    mean_luma = ImageStat.Stat(gray).mean[0]
    if mean_luma < 20:
        raise HTTPException(422, "Photo is too dark. Please use better lighting.")

    edge_stddev = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).stddev[0]
    if edge_stddev < 2.0:
        raise HTTPException(422, "Photo is too blurry or blank. Please upload a clear full-body photo.")

    return {"ok": True, "width": w, "height": h}


@app.post("/v1/tryon")
async def tryon(
    person: UploadFile = File(...),
    garment_url: str = Form(...),
    category: str = Form("upper"),
    authorization: str = Header(""),
):
    if authorization != f"Bearer {_token()}":
        raise HTTPException(401, "Unauthorized")
    if category not in {"upper", "lower", "dress"}:
        raise HTTPException(422, "Bad category")
    pb = await person.read()
    if len(pb) > MAX_BYTES:
        raise HTTPException(413, "Photo too large")
    person_img = clean(pb)
    garment_img = Image.open(io.BytesIO(await fetch(garment_url))).convert("RGBA")
    result = await get_provider().run(person_img, garment_img, category)
    out = io.BytesIO()
    result.save(out, "PNG")
    return Response(content=out.getvalue(), media_type="image/png")
