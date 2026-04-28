# Architecture

HKUgram is organized into three main layers:

- Frontend: React + Vite single-page application
- Backend: FastAPI application with SQLAlchemy ORM
- Data layer: MySQL relational database

## System Flow

1. The browser loads the React frontend.
2. The frontend selects a page through lightweight manual routing.
3. The frontend calls backend REST endpoints with `fetch`.
4. FastAPI validates input, loads a SQLAlchemy session, executes business logic, and returns JSON.
5. The frontend merges the response into local state and renders the result.

## Repository Layout

- `frontend/`: UI application
- `frontend/src/api/`: HTTP wrappers for backend endpoints
- `frontend/src/hooks/`: page and app state orchestration
- `frontend/src/components/`: reusable UI pieces
- `frontend/src/pages/`: page-level views
- `backend/app/api/routes/`: FastAPI routers
- `backend/app/crud/`: database and business logic
- `backend/app/models.py`: ORM models
- `backend/app/schemas.py`: request and response schemas
- `backend/app/services/`: uploads, session helpers, bootstrap logic
- `backend/app/query_engine.py`: read-only SQL and text-to-SQL helpers
- `backend/app/agent_engine.py`: AI-assisted discovery helpers

## Frontend Notes

- Single-page React app without React Router
- Route parsing is implemented manually
- Shared styling is centralized in `frontend/src/styles.css`
- App state is coordinated mainly in `useAppController`
- Feed and analytics use dedicated controller hooks

## Backend Notes

- `main.py` creates the FastAPI app and mounts `/uploads`
- Routers are grouped by domain: auth, users, posts, analytics, query, notifications, and agent
- Startup bootstrap logic creates tables and performs schema maintenance
- Query validation blocks non-read-only SQL

## Special Subsystems

### Query subsystem

The `/query` routes provide read-only SQL execution, deterministic text-to-SQL, and search comparison.

### AI discovery subsystem

The `/agent` routes generate draft SQL, require user approval, then execute validated SQL and summarize the result.
