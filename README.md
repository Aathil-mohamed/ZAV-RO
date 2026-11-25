# ZAVÉRO — Monorepo Architecture & Setup

Virtual Try-On + Pattern-Piece Customizer Fashion E-Commerce Platform for Men & Women.

---

## 1. Repository Structure

```
├── apps/
│   ├── api/          # Laravel 11 Backend (Sanctum, Filament Admin, S3/MinIO, Stripe)
│   ├── web/          # Next.js 14.2 App Router Frontend (Zustand, Three.js, Konva, Tailwind)
│   └── tryon/        # FastAPI Try-On Microservice (Python, Pillow, Mock/AI engine)
├── assets/
│   └── branding/     # Official ZAVÉRO logos and icons
├── scripts/
│   └── make-placeholders.mjs # Pre-rendered mannequin & garment placeholder generator
├── docs/             # Specs and architectural references
├── docker-compose.yml # PostgreSQL 16, Redis 7, MinIO S3, Mailpit
└── README.md
```

---

## 2. Infrastructure Services (Docker)

Start the backing infrastructure (Database, Redis, MinIO S3, Mailpit):

```bash
docker-compose up -d
```

| Service | Port | Description |
|---|---|---|
| **PostgreSQL 16** | `5432` | Main database (`store` / `store` / `store`) |
| **Redis 7** | `6379` | Cache, sessions, queue worker broker |
| **MinIO S3** | `9000` (API), `9001` (Console) | S3-compatible asset and upload storage |
| **Mailpit** | `1025` (SMTP), `8025` (Web UI) | Local email capture and testing |

*MinIO Note:* Open http://localhost:9001 (User: `minio`, Password: `minio12345`), ensure buckets `public-assets` (public read) and `private-uploads` (private) are created.

---

## 3. Applications

Run each service directly on your host machine in development:

### 3.1 Backend API (`apps/api` - Laravel 11 on port 8000)

```bash
cd apps/api

# Run database migrations
php artisan migrate

# Start local API server
php artisan serve --port=8000

# Start queue worker for try-on & background jobs
php artisan queue:work redis --tries=2

# Run tests & code style
./vendor/bin/pest
./vendor/bin/pint --test
```

- **Health check:** `GET http://localhost:8000/api/ping` -> `{"ok":true}`
- **Admin panel:** `http://localhost:8000/admin`

---

### 3.2 Frontend Web App (`apps/web` - Next.js 14.2 on port 3000)

```bash
cd apps/web

# Development mode
npm run dev

# Production build & lint
npm run lint
npm run build
```

- **Homepage:** `http://localhost:3000` (features live ping checker against backend API)

---

### 3.3 AI Try-On Service (`apps/tryon` - FastAPI on port 8100)

```bash
cd apps/tryon

# Activate virtual environment
.\.venv\Scripts\activate       # Windows
# source .venv/bin/activate    # Linux / macOS

# Start microservice
uvicorn main:app --port 8100 --reload
```

- **Health check:** `GET http://localhost:8100/health` -> `{"ok":true}`

---

## 4. Asset Generation

Generate pre-rendered studio mannequin model images (1200x2400 WebP + 400px thumbnails) for each garment and colorway:

```bash
node scripts/make-placeholders.mjs
```

Assets are saved directly into: `apps/web/public/dev-models/{gender}/{slug}/{color}.webp`.

---

## 5. PayHere Going Live Checklist (LKR)

When moving from PayHere Sandbox (`PAYHERE_MODE=sandbox`) to Production:

1. Complete live PayHere merchant approval and register the production domain to obtain your live **Merchant ID** and **Merchant Secret**.
2. Set `PAYHERE_MODE=live` and update `PAYHERE_MERCHANT_ID` and `PAYHERE_MERCHANT_SECRET` in `apps/api/.env` over HTTPS.
3. Set `PAYHERE_NOTIFY_URL` to your public HTTPS endpoint (`https://<production-domain>/api/payhere/notify`).
4. Publish **Refund / Returns**, **Privacy Policy**, and **Terms of Service** pages on the storefront (required by PayHere for live approval).
5. Confirm PayHere's current transaction fees and settlement terms before launch.
6. Verify and replace placeholder LKR prices (currently `USD-like × 300`) and shipping thresholds in `apps/api/config/store.php` (`STORE_SHIPPING_CENTS`, `STORE_FREE_SHIPPING_OVER_CENTS`).
