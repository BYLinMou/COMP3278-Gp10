# Run and Deploy

## Local Development

From the repository root:

```bash
docker compose up --build
```

Default services:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`
- MySQL: `127.0.0.1:3306`
- Adminer: `http://127.0.0.1:8080`

## Backend Only

1. Copy `.env.example` to `.env`.
2. Start MySQL from the repository root with `docker compose up -d db`.
3. Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

4. Start the API from `backend/`:

```bash
uvicorn app.main:app --reload
```

5. Seed sample data if needed:

```bash
python scripts/seed.py
```

## Frontend Only

1. Copy `.env.example` to `.env`.
2. Install frontend dependencies in `frontend/`:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8000` unless `VITE_API_BASE_URL` is overridden.

## Production Deployment

The repository includes `docker-compose.prod.yml` for server deployment using prebuilt images.

High-level steps:

1. Install Docker Engine and Docker Compose plugin on the target server.
2. Copy `docker-compose.prod.yml` and `.env.example` into the deployment directory.
3. Create `.env` from the example and fill in production values.
4. Run:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
```

## Published Images

- `ghcr.io/bylinmou/hkugram-backend:latest`
- `ghcr.io/bylinmou/hkugram-frontend:latest`
