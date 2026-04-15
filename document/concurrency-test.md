# Concurrency Verification

This project now includes a repeatable backend concurrency check:

```powershell
python backend\scripts\concurrency_check.py
```

## What It Verifies

- Same user sending two near-simultaneous `like` requests for the same post does not create duplicate like rows.
- Two different users liking the same post at nearly the same time both succeed.
- Same user sending two near-simultaneous `follow` requests for the same target does not create duplicate follow rows.

## Current Result

Latest local run passed with:

- same-user duplicate like: pass
- two-user concurrent like: pass
- same-user duplicate follow: pass

## Important Note

The original UI still uses toggle-style actions. For stronger multi-device safety, the backend now also supports explicit action intents:

- `POST /posts/{post_id}/like?user_id=...&intent=like`
- `POST /posts/{post_id}/like?user_id=...&intent=unlike`
- `POST /users/{username}/follow?follower_user_id=...&intent=follow`
- `POST /users/{username}/follow?follower_user_id=...&intent=unfollow`

These explicit intents are idempotent and are the safer contract for concurrent clients.
