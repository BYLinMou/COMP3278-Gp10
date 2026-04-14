# HKUgram Backend

This service provides the first core function for the COMP3278 project: a MySQL-backed backend for users, posts, likes, and comments.

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MySQL from the repository root with `docker compose up -d db`.
3. Install dependencies with `pip install -r backend/requirements.txt`.
4. Start the API with `uvicorn app.main:app --reload` from the `backend` directory.
5. Seed sample data with `python scripts/seed.py`.

## Endpoints

- `GET /health`
- `POST /users`
- `GET /feed?sort_by=recent|popular`
- `POST /posts`
- `POST /posts/{post_id}/like?user_id=...`
- `POST /posts/{post_id}/comments`
- `GET /users/{username}/posts`
