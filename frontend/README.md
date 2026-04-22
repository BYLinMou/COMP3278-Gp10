# HKUgram Frontend

React + Vite frontend for the COMP3278 project.

## Run locally

1. Copy `.env.example` to `.env`.
2. Run `npm install` inside `frontend`.
3. Start the dev server with `npm run dev`.

The frontend expects the backend API at `http://127.0.0.1:8000` unless `VITE_API_BASE_URL` is overridden.

When using the root development `docker-compose.yml`, set `FRONTEND_API_BASE_URL` in the root `.env`; Compose maps it to `VITE_API_BASE_URL` for the Vite dev server.

For container deployments, the production image can also read `FRONTEND_API_BASE_URL` at container startup and expose it through `runtime-config.js`, so you can point the same frontend image at a different API domain or public port without rebuilding.

For the full local demo from the repository root, use `docker compose up --build`.
