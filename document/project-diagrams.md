# HKUgram Project Diagrams

This file captures the diagrams that support the COMP3278 final presentation.
The diagrams below are aligned with the current implementation in `backend/app` and `frontend/src`.

## 1. System Architecture

```mermaid
flowchart LR
    User[Browser User] --> FE[React plus Vite Frontend]
    FE -->|REST API| BE[FastAPI Backend]
    BE -->|SQLAlchemy ORM| DB[(MySQL 8.4)]
    BE --> UP[Local Upload Storage]
    BE --> QE[Read-only Query Engine]
    BE --> AE[AI Discovery Agent Engine]
    AE --> LLM[External AI Provider]

    subgraph Frontend
      FE --> P1[Home Feed]
      FE --> P2[Create Post]
      FE --> P3[Profile and Follow]
      FE --> P4[History]
      FE --> P5[Analytics]
      FE --> P6[Search Comparison]
      FE --> P7[Settings and Auth]
      FE --> P8[Notification Menu]
      FE --> P9[Discovery Agent Panel]
    end

    subgraph Backend
      BE --> R1[/auth routes/]
      BE --> R2[/users routes/]
      BE --> R3[/posts routes/]
      BE --> R4[/notifications routes/]
      BE --> R5[/analytics routes/]
      BE --> R6[/query routes/]
      BE --> R7[/agent routes/]
    end
```

## 2. ER Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string username UK
        string password_hash
        string display_name
        string bio
        datetime created_at
    }

    POSTS {
        int id PK
        int user_id FK
        string category
        text description
        string image_url
        int image_width
        int image_height
        datetime created_at
    }

    LIKES {
        int id PK
        int user_id FK
        int post_id FK
        datetime created_at
    }

    COMMENTS {
        int id PK
        int user_id FK
        int post_id FK
        text body
        datetime created_at
    }

    VIEW_HISTORY {
        int id PK
        int user_id FK
        int post_id FK
        datetime viewed_at
    }

    FOLLOWS {
        int id PK
        int follower_id FK
        int followee_id FK
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        int actor_id FK
        int post_id FK
        string type
        bool is_read
        datetime created_at
    }

    USERS ||--o{ POSTS : creates
    USERS ||--o{ LIKES : performs
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ VIEW_HISTORY : records
    USERS ||--o{ FOLLOWS : follower
    USERS ||--o{ FOLLOWS : followee
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ NOTIFICATIONS : triggers

    POSTS ||--o{ LIKES : receives
    POSTS ||--o{ COMMENTS : contains
    POSTS ||--o{ VIEW_HISTORY : appears_in
    POSTS ||--o{ NOTIFICATIONS : references
```

## 3. Main Social Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as FastAPI
    participant D as MySQL

    U->>F: Open Home, Search, Analytics, or Profile
    F->>B: GET /feed, /query/popular-keywords, /analytics/overview, /users/{username}
    B->>D: Read posts, profiles, rankings, and search metadata
    D-->>B: Rows
    B-->>F: JSON response
    F-->>U: Feed, ranking, profile, and search UI

    U->>F: Like, comment, follow, create post, or mark notifications read
    F->>B: POST or PUT request
    B->>D: Insert or update relational rows
    B->>D: Create notification rows when applicable
    D-->>B: Commit success
    B-->>F: Updated counts, objects, or 204 response
    F-->>U: Immediate UI refresh
```

## 4. Query And Agent Flow

```mermaid
flowchart TD
    Prompt[User question or SQL text] --> Choice{Mode}

    Choice --> SQLAPI[/query/sql/]
    Choice --> T2S[/query/text-to-sql/]
    Choice --> CMP[/query/search-comparison/]
    Choice --> DRAFT[/agent/draft/]

    SQLAPI --> Guard1[Read-only validation]
    T2S --> Mapper[Deterministic prompt-to-SQL mapping]
    Mapper --> Guard1

    CMP --> SearchFlow[Full-text search plus text-to-SQL comparison]
    SearchFlow --> SearchUI[Search page result UI]

    Guard1 --> Exec1[Execute SELECT only]
    Exec1 --> Result1[Columns plus rows plus row_count]
    Result1 --> QueryUI[Search page or query demo UI]

    DRAFT --> AI1[External AI completion API]
    AI1 --> DraftSQL[Draft SQL plus explanation]
    DraftSQL --> Approval[User reviews and approves]
    Approval --> EXECUTE[/agent/execute/]
    EXECUTE --> Guard2[Read-only validation]
    Guard2 --> Exec2[Execute SELECT only]
    Exec2 --> Curate[AI curation or fallback ranking]
    Curate --> AgentUI[DiscoveryAgent UI]
```

## Notes For Presentation

- The required relational design is covered by `users`, `posts`, `likes`, `comments`, `view_history`, `follows`, and `notifications`.
- The SQL system requirement is covered by the read-only `/query/sql` endpoint, deterministic `/query/text-to-sql`, and the approval-based `/agent` workflow.
- The UI scope now includes feed, posting, profile/follow, history, analytics, search, notifications, and the AI discovery panel.
- Upload storage remains local to the backend and is exposed through `/uploads`.
- Deployment is still handled separately by Docker Compose with frontend, backend, MySQL, and Adminer services.
