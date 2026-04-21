# HKUgram Technical Architecture Reference

## 1. System Summary

HKUgram is a social media application built around a fairly clean three-layer split:

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React + Vite | Single-page UI, local routing, user interactions, optimistic updates |
| Backend | FastAPI + SQLAlchemy | API routing, business logic, session handling, relational queries |
| Data layer | MySQL | Core relational storage for users, posts, interactions, history, and notifications |

There are two special backend subsystems beyond the normal social feed:

1. A read-only SQL/query subsystem under `/query` for safe SQL execution and deterministic text-to-SQL patterns.
2. An AI-assisted discovery subsystem under `/agent` that prepares a query, requires user approval, then executes and summarizes the result.

At runtime, the normal request path is:

1. The browser loads the React app.
2. The frontend chooses a view using a lightweight pathname parser instead of React Router.
3. The frontend calls FastAPI endpoints with `fetch`.
4. FastAPI resolves dependencies, opens a SQLAlchemy session, executes CRUD/query logic, and returns JSON.
5. The frontend merges the response into page-level or app-level state and renders the result.

## 2. Repository Layout

| Path | Role |
| --- | --- |
| `frontend/` | Vite application and all user-facing UI code |
| `frontend/src/api/` | Thin HTTP client wrappers for backend endpoints |
| `frontend/src/hooks/` | State orchestration for app shell, feed, and analytics |
| `frontend/src/components/` | Shared UI building blocks such as feed cards, nav, thread drawer, and notification menu |
| `frontend/src/pages/` | Page-level view components |
| `frontend/src/lib/` | Route parsing, icons, formatting helpers, and constants |
| `backend/app/api/routes/` | FastAPI routers grouped by domain |
| `backend/app/crud/` | Database-facing business logic and aggregate queries |
| `backend/app/models.py` | SQLAlchemy ORM models and table relationships |
| `backend/app/schemas.py` | Pydantic request/response contracts |
| `backend/app/services/` | Upload handling, session cookie helpers, bootstrap/setup logic |
| `backend/app/query_engine.py` | Read-only SQL validator, text-to-SQL mapping, keyword search logic |
| `backend/app/agent_engine.py` | AI query drafting and result curation helpers |
| `backend/scripts/` | Bootstrap, seed, and concurrency helper scripts |
| `document/` | Diagrams, reports, presentation assets, and technical notes |

## 3. Frontend Architecture

### 3.1 Frontend Design Approach

The frontend is a single React application with:

- manual route parsing in `frontend/src/lib/routes.js`
- a single app shell in `frontend/src/App.jsx`
- shared global styling in `frontend/src/styles.css`
- domain-focused API wrappers in `frontend/src/api/`
- controller hooks that hide async and synchronization logic from page components

This means the app behaves like a SPA, but the routing layer stays intentionally lightweight and dependency-free.

### 3.2 Page Model

| Route | Page file | Purpose | Main collaborators |
| --- | --- | --- | --- |
| `/` | `frontend/src/pages/HomePage.jsx` | Feed, category filter, sort toggle, recommended creators, AI discovery panel | `CategoryTabs`, `MasonryFeed`, `SidebarUser`, `DiscoveryAgent` |
| `/create` | `frontend/src/pages/CreatePage.jsx` | Post publishing with upload mode or URL mode | `CATEGORIES`, app controller submit handler |
| `/profile` | `frontend/src/pages/ProfilePage.jsx` | Current user or guest profile view | `Avatar` |
| `/users/{username}` | `frontend/src/pages/ProfilePage.jsx` | Separate public author page route | `Avatar` |
| `/history` | `frontend/src/pages/HistoryPage.jsx` | Recently viewed posts for the current user | formatting helpers |
| `/analytics` | `frontend/src/pages/AnalyticsPage.jsx` | Platform metrics, top posts, active creators | `SidebarUser` |
| `/search` | `frontend/src/pages/SearchPage.jsx` | Full-text vs text-to-SQL search comparison UI | `MasonryFeed` |
| `/settings` | `frontend/src/pages/SettingsPage.jsx` | Login, registration, and profile editing | `Avatar` |

### 3.3 Component Composition

Important shared components:

| Component | Role |
| --- | --- |
| `TopNav` | Main navigation, theme toggle, profile menu, notification dropdown entry |
| `NotificationButton` | Polls notifications every 30 seconds for logged-in users and marks them read when opened |
| `MasonryFeed` | Measures card heights and assigns CSS grid row spans for the masonry layout |
| `PostCard` | Feed tile with image, author metadata, recent comment previews, like/comment controls |
| `ThreadDrawer` | Post detail overlay with full comment thread and interactive image-like behavior |
| `DiscoveryAgent` | Two-step AI workflow: draft SQL first, then execute after explicit approval |
| `CategoryTabs` | Shared category chooser for feed and post creation |
| `SidebarUser` | Reusable compact user row for creator recommendations and analytics lists |
| `Avatar` | Username-derived avatar badge |
| `CommentList` | Comment thread renderer inside the drawer |

### 3.4 State Management

The main state entry point is `frontend/src/hooks/useAppController.js`. It acts as the app-level orchestration layer and is responsible for:

- session recovery
- current user state
- current route/view
- selected profile
- selected post and comments
- login, registration, settings, and post creation forms
- browsing history
- follow state
- status messaging

Two specialized hooks support it:

| Hook | Responsibility |
| --- | --- |
| `useFeedController` | Feed loading, category/sort state, pagination, optimistic feed patching, viewer-specific refreshes |
| `useAnalyticsController` | Analytics overview loading state and caching |

The design is pragmatic rather than heavily normalized. Most coordination lives in `useAppController`, while the feed and analytics each get a dedicated hook.

### 3.5 Routing Strategy

Routing is implemented without React Router:

- `parseRoute(pathname)` maps `window.location.pathname` into a small route object.
- `routeToPath(route)` converts route state back into a URL.
- `navigate()` updates the browser history with `pushState`.
- a `popstate` listener keeps the UI synchronized when the user goes back or forward.

This keeps the frontend simple, but it also means route behavior is defined manually and must stay synchronized with the page list.

### 3.6 Styling and Design System

The visual system is centralized in `frontend/src/styles.css`. Key traits:

- CSS custom properties for theme tokens such as `--bg`, `--panel`, `--gold`, `--border`, and font stacks
- dark and light theme variants controlled by `data-theme`
- Art Deco-inspired crosshatch background, gold borders, uppercase display typography, and framed card motifs
- responsive layout through plain CSS media queries instead of a component library

Important design decisions already encoded in CSS:

- theme state is persisted in `localStorage`
- the masonry feed uses CSS grid plus runtime measurement, not a third-party masonry package
- post cards use `image_width` and `image_height` from the backend to choose `landscape`, `square`, or `portrait` framing without waiting for image load
- the thread drawer includes a decorative like burst animation for double-click/tap interactions

## 4. Backend Architecture

### 4.1 Application Entry

`backend/app/main.py` is the runtime entry point. It is responsible for:

- creating the FastAPI app
- applying CORS middleware
- running database initialization on startup
- exposing `/uploads` as a static file mount
- registering all routers
- exposing `/health`

### 4.2 Backend Layering

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Configuration | `config.py` | Environment parsing, API/DB/session settings |
| Database | `database.py` | SQLAlchemy engine, base class, session factory |
| Models | `models.py` | ORM schema for all application tables |
| Schemas | `schemas.py` | Request validation and response serialization |
| Routing | `api/routes/*.py` | HTTP path definitions and dependency injection |
| CRUD | `crud/*.py` | Transactional logic and aggregate query assembly |
| Services | `services/*.py` | Upload saving, startup schema maintenance, session cookie helpers |
| Security | `security.py` | Password hashing and signed session cookie primitives |
| Query subsystem | `query_engine.py` | Read-only SQL guardrails and deterministic search/text-to-SQL logic |
| AI subsystem | `agent_engine.py` | External AI calls for SQL drafting and curated recommendations |

### 4.3 Router Breakdown

| Router | Prefix | Scope |
| --- | --- | --- |
| `auth.py` | `/auth` | login, logout, session recovery |
| `users.py` | none | users, profiles, history, follow actions |
| `posts.py` | none | feed, post detail, upload, likes, comments, views |
| `analytics.py` | `/analytics` | aggregate platform metrics |
| `query.py` | `/query` | schema introspection, read-only SQL, text-to-SQL, keyword ranking |
| `notifications.py` | `/notifications` | notification inbox and mark-as-read |
| `agent.py` | `/agent` | AI-assisted SQL drafting and approved execution |

### 4.4 Security Model

The current security model is lightweight and implementation-driven. It is best understood as a set of guarded components rather than a fully centralized auth/authorization framework.

#### 4.4.1 Trust Boundaries

The system has four practical trust boundaries:

1. Browser client
2. FastAPI backend
3. MySQL database
4. External AI provider used by the `/agent` workflow

The frontend is treated as an untrusted caller. Backend validation is therefore the real security boundary for:

- login and session recovery
- write operations
- file uploads
- SQL execution
- AI-generated query approval and execution

#### 4.4.2 Authentication

Authentication currently has two mechanisms:

1. Password verification with PBKDF2-SHA256 in `backend/app/security.py`
2. Signed session cookies that store the authenticated username in tamper-evident form

Password handling details:

- password hashes are stored in `users.password_hash`
- hashes use PBKDF2-SHA256 with a per-password random salt
- comparison uses `hmac.compare_digest`
- schema-level validation enforces password length constraints on create/update/login payloads

Session handling details:

- login sets a signed cookie via `backend/app/services/session.py`
- the cookie payload is the base64-encoded username plus an HMAC-SHA256 signature
- `get_current_session_user()` verifies the signature, decodes the username, and reloads the user record from the database

The current cookie flags in code are:

- `HttpOnly=True`
- `SameSite="lax"`
- `secure=False`
- `max_age=settings.session_max_age_seconds`

This is important because the current implementation is convenient for local development, but it is **not** the stricter cross-site HTTPS cookie configuration that a production deployment would usually require.

#### 4.4.3 Authorization Model

Authorization is only partially session-based.

Routes that are clearly protected by a backend session dependency include:

- `GET /auth/session`
- `GET /notifications`
- `POST /notifications/read`

Many other mutating endpoints currently use an actor identifier supplied by the client, for example:

- `POST /posts` with `user_id`
- `POST /posts/upload` with `user_id`
- `POST /posts/{post_id}/like` with `user_id`
- `POST /posts/{post_id}/comments` with `payload.user_id`
- `POST /posts/{post_id}/views` with `user_id`
- `POST /users/{username}/follow` with `follower_user_id`
- `PUT /users/{username}` without checking that the session owner matches `{username}`

So the current model is:

- authentication exists
- some endpoints consume it directly
- many domain endpoints still trust caller-supplied user identity after only checking that the referenced user exists

That means the codebase currently has a mixed model of authentication and authorization. This is acceptable for a course/demo system, but it is the most important security limitation in the current backend design.

#### 4.4.4 CORS and Browser Credential Flow

The backend enables:

- `allow_credentials=True`
- explicit allowed origins from `CORS_ORIGINS`
- all methods
- all headers

The frontend consistently uses `credentials: "include"` when session-aware requests are expected.

Security-wise, this means:

- cookies can be sent from approved origins
- origin control depends on correct `CORS_ORIGINS` configuration
- with `SameSite="lax"` and `secure=False`, the current session setup is tuned more for local use than hardened deployment

#### 4.4.5 Input Validation

Input validation is spread across Pydantic schemas and route-level parameter constraints.

Examples:

- username, password, display name, bio, caption, and comment lengths are bounded in `schemas.py`
- query parameters such as `sort_by` and `intent` are constrained with regex/pattern checks
- feed pagination is bounded with `limit` and `offset` validation

This reduces malformed input risk and keeps API behavior predictable.

#### 4.4.6 File Upload Safety

The upload path adds a small but real safety layer:

- `save_uploaded_image()` requires `content_type` to start with `image/`
- the file bytes must be successfully parsed by Pillow
- image width and height must be positive before the file is saved
- filenames are randomized with `uuid4()`

However, the current upload model does **not** yet show:

- explicit file size limits
- extension allowlists separate from MIME/type parsing
- malware scanning
- image content moderation

So uploads are validated as decodable images, but not deeply sanitized.

#### 4.4.7 Query Safety

The `/query` and `/agent` features are the most security-sensitive part of the backend because they execute SQL derived from user input.

The project mitigates this by enforcing read-only query rules in `validate_read_only_sql()`:

- SQL must begin with `SELECT`
- write/admin keywords are blocked
- SQL comments are blocked
- semicolons are blocked, preventing multi-statement execution

The agent flow adds a second layer:

- AI-generated SQL is parsed and normalized
- it is revalidated before execution
- the frontend requires explicit user approval between draft and execute steps
- deterministic fallback SQL generation exists when AI output is unusable

This is a meaningful safety boundary and one of the stronger parts of the current codebase.

#### 4.4.8 External AI Boundary

The `/agent` subsystem calls an external chat completion API from the backend only.

Important security properties:

- `AI_API_KEY` remains server-side
- the browser never receives the provider key
- the model output is not executed blindly

Important current limitation:

- the agent routes themselves are not session-protected, so the AI drafting/execution surface is currently available without login

#### 4.4.9 Data Integrity Controls

Several database-level constraints also support the security model by preventing inconsistent or duplicate interaction state:

- unique usernames
- unique likes per `(user_id, post_id)`
- unique follows per `(follower_id, followee_id)`
- unique view-history rows per `(user_id, post_id)`
- foreign-key cascades to prevent orphaned dependent rows

These are integrity controls rather than access controls, but they help keep the system state coherent under repeated or concurrent requests.

#### 4.4.10 Demo-Oriented Security Assumptions

The current project still carries explicit demo/development assumptions:

- `.env.example` contains local-friendly defaults
- cookies are not marked `Secure`
- the settings UI documents predictable demo passwords for seeded/example users
- bootstrap logic can backfill legacy users with generated default passwords of the form `username + "123"` when upgrading old schemas

Those choices are practical for coursework and demonstrations, but they should be understood as part of the current security posture.

#### 4.4.11 Security Summary

The strongest implemented controls today are:

- password hashing
- HMAC-signed session cookies
- explicit session checks on notification/session routes
- schema and parameter validation
- read-only SQL validation
- AI query approval before execution

The main current gaps are:

- incomplete authorization on many write endpoints
- development-oriented cookie flags
- limited upload hardening
- unauthenticated access to query and agent subsystems

### 4.5 Startup Bootstrap Strategy

The project does not use Alembic or a formal migration chain. Instead, `backend/app/services/bootstrap.py` performs startup-time schema maintenance:

- `Base.metadata.create_all()`
- `ensure_password_schema()`
- `ensure_post_schema()`
- `ensure_follow_schema()`
- `ensure_search_indexes()`
- `backfill_local_post_dimensions()`

This gives the project a migration-like safety net for course/demo use, but it is still startup bootstrap logic rather than a full migration framework.

## 5. Main Runtime Flows

### 5.1 Feed Loading

1. `useFeedController` requests `GET /feed`.
2. The backend composes a joined query across `posts`, `users`, `likes`, and `comments`.
3. `like_count` and `comment_count` are computed at query time.
4. If `viewer_user_id` is provided, the backend also marks `liked_by_viewer`.
5. Recent comments are attached as lightweight previews.

### 5.2 Login and Session Recovery

1. `POST /auth/login` verifies the password hash and sets the signed cookie.
2. The frontend later calls `GET /auth/session` during bootstrap.
3. If successful, the app reloads the user's profile and view history and treats the session as restored.

### 5.3 Post Creation

Two creation paths exist:

- `POST /posts` for direct image URLs
- `POST /posts/upload` for uploaded image files

The upload path is richer because it:

- saves the uploaded file locally
- extracts image width and height
- creates a URL under `/uploads/...`
- persists image dimensions so the frontend can render better card aspect ratios

### 5.4 Like, Comment, and Follow

All three interaction types may create notification rows:

- liking a post creates a `like` notification for the post owner
- commenting creates a `comment` notification for the post owner
- following creates a `follow` notification for the followed user

Each interaction updates relational data immediately and returns the new state needed by the frontend.

### 5.5 Browsing History

Opening a post while logged in calls `POST /posts/{post_id}/views`.

The backend uses `view_history` as a deduplicated "latest view" table:

- if the same user already viewed the post, the old row is deleted
- a fresh row is inserted with the new timestamp

This preserves one row per user/post pair while still surfacing the latest viewing order.

### 5.6 Search Comparison

The search page sends `POST /query/search-comparison`.

The backend then:

1. tries a MySQL FULLTEXT query across posts, users, and comments
2. falls back to a `LIKE`-based search if FULLTEXT is unavailable
3. generates a deterministic text-to-SQL query for the same search phrase
4. returns both result sets together so the UI can compare them

### 5.7 AI Discovery Agent

The discovery agent follows a two-step approval design:

1. `POST /agent/draft` asks the AI to prepare a read-only SQL query and a short explanation.
2. The user reviews the SQL in the UI.
3. `POST /agent/execute` runs only after approval.
4. The backend validates the SQL again, executes it, then optionally asks the AI to summarize and recommend posts.

This separation is important because the project treats AI-generated SQL as draft material, not something to run automatically without user confirmation.

## 6. Database Design

### 6.1 Design Principles

The relational model is normalized around a small number of core entities:

- users
- posts
- likes
- comments
- follows
- view history
- notifications

Aggregate values such as total likes and total comments are generally **computed on read** rather than denormalized into counter columns.

### 6.2 Table Reference

| Table | Core columns | Purpose | Constraints / notes |
| --- | --- | --- | --- |
| `users` | `id`, `username`, `password_hash`, `display_name`, `bio`, `created_at` | Account identity and public profile | `username` is unique; passwords are stored as PBKDF2 hashes |
| `posts` | `id`, `user_id`, `category`, `description`, `image_url`, `image_width`, `image_height`, `created_at` | Main content entity | each post belongs to one user; image dimensions help frontend layout |
| `likes` | `id`, `user_id`, `post_id`, `created_at` | Many-to-many user/post reaction table | unique `(user_id, post_id)` prevents duplicate likes |
| `comments` | `id`, `user_id`, `post_id`, `body`, `created_at` | Post discussion | one user can create many comments on the same post |
| `view_history` | `id`, `user_id`, `post_id`, `viewed_at` | Recently viewed posts per user | unique `(user_id, post_id)` plus delete-and-reinsert behavior keeps one latest row per post |
| `follows` | `id`, `follower_id`, `followee_id`, `created_at` | Self-referential user-to-user follow graph | unique `(follower_id, followee_id)`; self-follow is blocked in CRUD logic |
| `notifications` | `id`, `user_id`, `actor_id`, `type`, `post_id`, `is_read`, `created_at` | Inbox events for follow/like/comment activity | `user_id` is the recipient; `actor_id` is the initiator; `post_id` is nullable for follow events |

### 6.3 Relationship Model

Key relationships:

- one `user` to many `posts`
- one `user` to many `likes`
- one `user` to many `comments`
- one `post` to many `likes`
- one `post` to many `comments`
- one `user` to many `notifications` as recipient
- one `user` to many `notifications` as actor
- self-referential many-to-many follow graph through `follows`

Deletion behavior is mostly cascade-based through foreign keys with `ON DELETE CASCADE`, which keeps the database tidy when a parent row disappears.

### 6.4 Query and Index Strategy

Important index-related behavior:

- primary keys exist on every table
- `users.username` is indexed and unique
- `posts.created_at` and some notification/view fields are indexed for sorting
- composite uniqueness protects duplicate likes, follows, and history rows
- MySQL FULLTEXT indexes are created at startup for:
  - `posts(description, category)`
  - `users(username, display_name, bio)`
  - `comments(body)`

The application is designed to keep working even if FULLTEXT index creation fails locally; the search engine falls back to `LIKE`.

### 6.5 Why the Table Design Fits the App

This schema is a good match for the current product scope because:

- social interactions remain normalized and easy to reason about
- most analytics can be derived with SQL aggregation rather than background jobs
- feed ranking can switch between recent and popular without changing the schema
- history, notifications, and follows remain decoupled from the post table
- the query subsystem can expose useful SQL examples on top of the same relational model

## 7. API Path Design

### 7.1 General Path Philosophy

The API uses a mostly resource-oriented design with a few action-style suffixes where pure CRUD would be awkward.

Observed conventions:

- top-level resource collections for the social domain: `/users`, `/posts`, `/feed`
- prefixed namespaces for specialized subsystems: `/auth`, `/analytics`, `/query`, `/notifications`, `/agent`
- query parameters for viewer context and intent, for example `viewer_user_id`, `sort_by`, `category`, `limit`, `offset`, `intent`
- action endpoints when the operation toggles a state rather than creating a standalone exposed resource, for example `/like`, `/follow`, `/views`, `/read`, `/draft`, `/execute`

### 7.2 Infrastructure and Utility Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/health` | Basic health check | returns `{ "status": "ok" }` |
| `GET` | `/uploads/{filename}` | Serves uploaded images | mounted as static files by FastAPI |

### 7.3 Auth Endpoints

| Method | Path | Purpose | Auth model |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Log in and set session cookie | username/password in body |
| `GET` | `/auth/session` | Restore current session user | requires valid signed cookie |
| `POST` | `/auth/logout` | Clear session cookie | session-based |

### 7.4 User and Profile Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/users` | Create account | returns `UserRead`; `409` on duplicate username |
| `GET` | `/users` | List users | used by settings/register page |
| `GET` | `/users/{username}` | Load profile and stats | optional `viewer_user_id` adds follow context |
| `PUT` | `/users/{username}` | Update profile | body includes display name, bio, optional password |
| `GET` | `/users/{username}/posts` | List posts by user | currently built from the feed query path |
| `GET` | `/users/{username}/history` | List recently viewed posts | intended for the current user experience |
| `POST` | `/users/{username}/follow` | Toggle or force follow state | uses `follower_user_id` and optional `intent=toggle|follow|unfollow` |

### 7.5 Feed and Post Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/feed` | Load the homepage feed | supports `sort_by`, `category`, `limit`, `offset`, `viewer_user_id` |
| `POST` | `/posts` | Create a post from an image URL | JSON body |
| `POST` | `/posts/upload` | Create a post from an uploaded image file | multipart form data |
| `GET` | `/posts/{post_id}` | Load one post in detail | optional `viewer_user_id` |
| `POST` | `/posts/{post_id}/like` | Toggle like state | `user_id` query param plus optional `intent` |
| `GET` | `/posts/{post_id}/comments` | List comments for a post | ascending chronological order |
| `POST` | `/posts/{post_id}/comments` | Add a comment | JSON body with `user_id` and `body` |
| `POST` | `/posts/{post_id}/views` | Record a history view | `204 No Content` on success |

### 7.6 Analytics Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/analytics/overview` | Aggregate platform counts, top posts, active users | powers the analytics page |

### 7.7 Query Subsystem Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/query/schema` | Return exposed schema context and supported question patterns | useful for demos and debugging |
| `POST` | `/query/sql` | Execute a validated read-only SQL statement | blocks non-`SELECT` statements, comments, and semicolons |
| `POST` | `/query/text-to-sql` | Map a supported prompt into safe SQL and execute it | deterministic rule-based mapping |
| `GET` | `/query/popular-keywords` | Return ranked preset keywords | used by the search page |
| `POST` | `/query/search-comparison` | Compare FULLTEXT search with text-to-SQL | returns both result sets plus notes |

### 7.8 Notification Endpoints

| Method | Path | Purpose | Auth model |
| --- | --- | --- | --- |
| `GET` | `/notifications` | List current user's notifications | requires session cookie; supports `unread_only` |
| `POST` | `/notifications/read` | Mark current user's notifications as read | requires session cookie |

### 7.9 AI Agent Endpoints

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/agent/draft` | Ask the AI to prepare a safe draft query | returns SQL plus explanation; intended for review |
| `POST` | `/agent/execute` | Execute an approved query and curate results | validates SQL again before execution |

### 7.10 Path Design Observations

The current path design is effective for a course project because:

- the social CRUD endpoints stay simple and discoverable
- specialized query and AI features are clearly separated from normal app traffic
- the feed endpoint cleanly handles pagination and personalization hints
- the system avoids exposing unnecessary internal table-level endpoints such as `/likes` or `/follows`

The main design inconsistency to keep in mind is the mixed actor model:

- some routes trust session state
- others trust explicit user identifiers from query/body parameters

That is acceptable for the current project scope, but it should remain clearly documented.

## 8. Key API Contracts

These response shapes appear repeatedly across the system.

| Schema | Main fields | Used by |
| --- | --- | --- |
| `UserRead` | `id`, `username`, `display_name`, `bio`, `created_at` | auth, users |
| `PostRead` | post metadata plus `like_count`, `comment_count`, `username`, `display_name`, `liked_by_viewer`, `recent_comments` | feed, post detail, profile |
| `CommentRead` | comment body, timestamps, author metadata | thread drawer, post comment list |
| `UserProfileResponse` | `user`, `stats`, `recent_posts`, `is_following`, `following_usernames` | profile page |
| `AnalyticsOverview` | totals, `top_posts`, `active_users` | analytics page |
| `SearchComparisonResponse` | query text, FULLTEXT result, text-to-SQL result, notes | search page |
| `AgentDraftResponse` | prompt, SQL, explanation, `requires_approval` | discovery agent approval step |
| `AgentExecuteResponse` | SQL, rows, `answer`, `post_links`, `recommendations`, `analysis_source` | discovery agent result step |
| `NotificationRead` | actor info, type, post id, read state, timestamp | notification dropdown |

Two contracts deserve special attention:

1. `PostRead` is intentionally richer than the raw `posts` table because the frontend needs author info, counts, comment previews, and viewer-like state in a single payload.
2. `AgentExecuteResponse` blends raw database output with presentation-oriented fields such as `answer` and curated recommendations, so the frontend does not need to understand the AI ranking logic.

## 9. Query and AI Subsystem Notes

### 9.1 Read-Only SQL Guardrails

`backend/app/query_engine.py` rejects SQL unless it passes all of these checks:

- starts with `SELECT`
- contains no blocked write/admin keywords
- contains no SQL comments
- contains no semicolon, which prevents multi-statement execution

This makes the `/query/sql` and `/agent/execute` surfaces safer for demos and classroom use.

### 9.2 Deterministic Text-to-SQL

The `/query/text-to-sql` endpoint is not a general LLM SQL generator. It is a deterministic mapper for a small supported prompt family such as:

- most liked posts
- most active users
- recent posts
- comments for post `<id>`
- posts by user `<username>`
- search posts about `<keyword>`

That keeps the feature predictable and easy to explain during evaluation.

### 9.3 AI Agent Scope

The `/agent` subsystem is broader than `/query/text-to-sql` because it can call an external chat completion API. Even so, it still keeps strict guardrails:

- AI output is parsed and sanitized
- SQL is revalidated before execution
- fallback deterministic SQL generation exists if AI output is unusable
- the frontend requires explicit approval before running the query

### 9.4 Schema Exposure Differences

One implementation detail worth documenting:

- `SCHEMA_CONTEXT` in `query_engine.py` exposes the main social tables and `view_history`
- the AI agent system prompt focuses mostly on post-centric discovery tables and does not emphasize every table equally

That means the query subsystem and the AI subsystem are related, but not identical in scope.

## 10. Current Constraints and Extension Points

Important current constraints:

- routing is manual, so any new page must be added in both `parseRoute()` and `routeToPath()`
- schema evolution happens on startup, not through a formal migration history
- uploaded files are stored locally and served from FastAPI static hosting
- notifications are poll-based rather than push-based
- several write routes rely on caller-supplied actor IDs instead of mandatory server-side session binding
- aggregate counters are computed live, which keeps writes simple but pushes more work into read queries

Natural extension points in the current architecture:

- add new user-facing features by introducing one table, one CRUD module change, and one page/controller flow
- add richer analytics by extending `crud/analytics.py`
- add more supported text-to-SQL patterns by extending `query_engine.text_to_sql()`
- add stricter auth by converting actor-id-based routes to `Depends(get_current_session_user)`
- replace startup bootstrap with migrations if the project needs long-term maintainability

## 11. Final Assessment

The current HKUgram architecture is stronger than a minimal demo app because it already separates:

- UI composition from data-fetch logic
- route handlers from CRUD/query logic
- normal product APIs from experimental query/AI APIs
- core relational data from derived analytics

Its most notable architectural characteristics are:

- lightweight SPA routing without a router library
- a normalized MySQL schema that supports both social features and SQL demonstrations
- dynamic aggregate queries instead of denormalized counters
- a startup bootstrap approach for schema evolution
- a distinct two-step AI query approval workflow

For code readers, this document should be read together with `document/project-diagrams.md`: the diagram file is better for presentation, while this file is intended as the implementation-level reference.
