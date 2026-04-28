# API Reference

## Infrastructure

- `GET /health`: health check
- `GET /uploads/{filename}`: serve uploaded images

## Authentication

- `POST /auth/login`: log in and set a signed session cookie
- `GET /auth/session`: recover current logged-in user from cookie
- `POST /auth/logout`: clear the session cookie

## Users and Profiles

- `POST /users`: create a user
- `GET /users`: list users
- `GET /users/{username}`: get profile and stats
- `PUT /users/{username}`: update profile
- `GET /users/{username}/posts`: list posts by a user
- `GET /users/{username}/history`: list recent viewing history
- `POST /users/{username}/follow`: follow, unfollow, or toggle follow state

## Feed and Posts

- `GET /feed`: list posts with sort, category, pagination, and viewer context
- `POST /posts`: create a post from an image URL
- `POST /posts/upload`: create a post from an uploaded image
- `GET /posts/{post_id}`: load a single post in detail
- `POST /posts/{post_id}/like`: like or unlike a post
- `GET /posts/{post_id}/comments`: list comments
- `POST /posts/{post_id}/comments`: add a comment
- `POST /posts/{post_id}/views`: record a browsing-history view

## Notifications

- `GET /notifications`: list notifications for the current session user
- `POST /notifications/read`: mark notifications as read

## Analytics

- `GET /analytics/overview`: return platform metrics, top posts, and active users

## Query Subsystem

- `GET /query/schema`: exposed schema and supported question patterns
- `POST /query/sql`: execute a validated read-only SQL query
- `POST /query/text-to-sql`: map supported prompts to SQL and execute them
- `GET /query/popular-keywords`: list preset popular keywords
- `POST /query/search-comparison`: compare full-text and text-to-SQL results

## AI Discovery Agent

- `POST /agent/draft`: generate a draft read-only SQL query plus explanation
- `POST /agent/execute`: execute an approved and revalidated SQL query
