# HKUgram

## Project Overview

HKUgram is built for COMP3278 course project Scenario 2, it is a social media application backed by a relational database. The system lets users register accounts, publish image posts, browse a feed, like and comment on posts, follow creators, review browsing history, and explore basic analytics such as popular posts and active users.

The project is designed to satisfy the course requirements across database design, query capability, UI, and deployment. It uses `FastAPI` and `SQLAlchemy` on the backend, `MySQL` as the core relational database, and `React + Vite` on the frontend with an Art Deco visual direction. In addition to the social feed workflow, HKUgram includes a read-only SQL and Text-to-SQL query feature for demoing database access and visualization on top of the same dataset.

### 🎞️ Video Demo
https://github.com/user-attachments/assets/e464dae1-ce23-4e67-b0cf-07a4a33d725b

## Services (development)

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`
- MySQL: `127.0.0.1:3307`
- Database visualizer (Adminer): `http://127.0.0.1:8080`

Adminer login values:

- System: `MySQL`
- Server: `db` when using Docker Compose network, or `host.docker.internal` if needed from another container setup
- Username: `hkugram`
- Password: `hkugram`
- Database: `hkugram`

## Run the full project

1. From the repository root, run `docker compose up --build`.
2. Open `http://127.0.0.1:5173` for the frontend.
3. Backend API is available at `http://127.0.0.1:8000`.
4. MySQL is exposed on `127.0.0.1:3306`.

## Docker Images

This project publishes two separate container images instead of one combined image.

- Backend image: `ghcr.io/bylinmou/hkugram-backend:latest`
  Runs the FastAPI application and backend bootstrap logic.
- Frontend image: `ghcr.io/bylinmou/hkugram-frontend:latest`
  Serves the built Vite frontend with Nginx.

The images are separated on purpose:

- backend and frontend use different runtimes
- they can be rebuilt and redeployed independently
- CI/CD is simpler
- production deployments are easier to scale and maintain

## How To Deploy

### Option 1: Local development deployment

This is the current development setup in this repository.

1. Clone the repository.
2. From the repository root, run:

```bash
docker compose up --build
```

3. Open:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`
- MySQL: `127.0.0.1:3306`

This mode is for development because:

- backend is built locally from `backend/Dockerfile`
- frontend runs the Vite dev server instead of the production frontend image

### Option 2: Deploy on server with docker-compose.prod.yml (production)

Use this when deploying on a Linux server with prebuilt images. You do not need to clone the full repository on the server.

1. Install Docker Engine and Docker Compose plugin on the server.
2. Create a deployment directory, for example `/opt/hkugram`.
3. Copy these files into that directory:

- `docker-compose.prod.yml`
- `.env.example`

4. Create `.env` from the example file:

```bash
cd /opt/hkugram
cp .env.example .env
```

5. Edit `.env` and fill in the real values you need. At minimum, check:

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`
- `AI_TIMEOUT_SECONDS`
- `FRONTEND_API_BASE_URL`
- `CORS_ORIGINS`

6. Start the production stack:

```bash
cd /opt/hkugram
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
```

7. Open the deployed services:

- Frontend: `http://<server-ip>/`
- Backend API: `http://<server-ip>:8000`
- Adminer: `http://<server-ip>:8070`

`FRONTEND_API_BASE_URL` accepts a full origin such as `http://<server-ip>:8000` or `https://api.example.com`. Leave it empty only if the frontend should infer the API host from the current page hostname and default to port `8000`.

The production stack uses prebuilt container images. To use `FRONTEND_API_BASE_URL`, deploy a frontend image version that already includes the runtime config support introduced in this repository.

For later updates, replace `docker-compose.prod.yml` if needed, update `.env` if needed, then run the same Docker Compose command block again.

### Option 3: Deploy individual containers manually

You can also run the images without Compose, but Compose is the simpler option because this project also needs MySQL.

In practice, the recommended deployment path for this repo is:

1. MySQL container
2. backend image
3. frontend image

## Deployment Notes

- The backend image expects a working MySQL database through `DATABASE_URL`.
- The backend runs bootstrap on startup, so schema creation and seed logic happen there.
- The frontend image is static and does not contain the backend.
- Because the frontend and backend are separate images, redeploying the UI does not require rebuilding the API image.

## GitHub Actions

- `.github/workflows/ci.yml`
  Runs backend compile checks and frontend production build on push and pull request.

- `.github/workflows/release.yml`
  Reads the project version from `VERSION`, creates a `v<version>` Git tag and GitHub Release when that tag does not already exist, then builds and publishes backend/frontend Docker images to GHCR:
  - `ghcr.io/<owner>/hkugram-backend:<version>`
  - `ghcr.io/<owner>/hkugram-frontend:<version>`
  The workflow can run on every push to `main`, but it only publishes a new release when the current `VERSION` does not already have a matching git tag.

- `.github/workflows/deploy.yml`
  Deploys the Docker Compose stack to the remote server over SSH. Configure the required repository or environment secrets before use, including `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_PRIVATE_KEY`, and `DEPLOY_PROJECT_PATH`.

Use [`.env.example`](C:\Users\User\Desktop\COMP3278\GroupProject\.env.example) as the template for the server-side `.env` file.
