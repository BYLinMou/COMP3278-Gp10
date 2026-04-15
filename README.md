# HKUgram

Course project for COMP3278. The implementation is being delivered one core function at a time following the provided requirements.

## Current status

- Core function 1 complete: MySQL schema plus backend CRUD APIs
- Core function 2 complete: read-only SQL query system and Text-to-SQL demo queries
- Core function 3 complete: React frontend with Art Deco feed, posting flow, and query dashboard
- Core function 4 in progress: integrated Docker deployment and demo readiness

## Run the full project

1. From the repository root, run `docker compose up --build`.
2. Open `http://127.0.0.1:5173` for the frontend.
3. Backend API is available at `http://127.0.0.1:8000`.
4. MySQL is exposed on `127.0.0.1:3306`.

## GitHub Actions

- `.github/workflows/ci.yml`
  Runs backend compile checks and frontend production build on push and pull request.

- `.github/workflows/release.yml`
  Reads the project version from `VERSION`, creates a `v<version>` Git tag and GitHub Release when that tag does not already exist, then builds and publishes backend/frontend Docker images to GHCR:
  - `ghcr.io/<owner>/hkugram-backend:<version>`
  - `ghcr.io/<owner>/hkugram-frontend:<version>`
  The workflow can run on every push to `main`, but it only publishes a new release when the current `VERSION` does not already have a matching git tag.

The release workflow uses the repository `GITHUB_TOKEN`, so package publishing must be allowed for Actions in the repository settings.
