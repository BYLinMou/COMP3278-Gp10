# Database Design

The relational model is centered on a small set of core entities:

- `users`
- `posts`
- `likes`
- `comments`
- `view_history`
- `follows`
- `notifications`

## Table Summary

### `users`

Stores account identity and profile data.

Main columns:

- `id`
- `username`
- `password_hash`
- `display_name`
- `bio`
- `created_at`

### `posts`

Stores image-based posts created by users.

Main columns:

- `id`
- `user_id`
- `category`
- `description`
- `image_url`
- `image_width`
- `image_height`
- `created_at`

### `likes`

Stores user reactions to posts.

Key rule:

- unique `(user_id, post_id)` to prevent duplicate likes

### `comments`

Stores post discussion.

Main columns:

- `id`
- `user_id`
- `post_id`
- `body`
- `created_at`

### `view_history`

Tracks recently viewed posts per user.

Key rule:

- unique `(user_id, post_id)` with latest-view behavior

### `follows`

Stores the self-referential user follow graph.

Key rule:

- unique `(follower_id, followee_id)`

### `notifications`

Stores inbox events for likes, comments, and follows.

Main columns:

- `id`
- `user_id`
- `actor_id`
- `type`
- `post_id`
- `is_read`
- `created_at`

## Design Characteristics

- Normalized structure for core social features
- Aggregate counts are computed on reads
- Foreign-key cascades keep dependent records consistent
- Search-related indexes support SQL and text-based exploration
- FULLTEXT indexes are created when available, with `LIKE` fallback support
