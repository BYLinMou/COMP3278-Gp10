# Social Feature Gap Analysis

## Scope

This document compares the current HKUgram repo against common features in mainstream social platforms. The goal is not to copy every large-platform feature, but to identify common and important features that are missing from this repo and would make sense for a course project.

Current repo already has:

- User registration, login, logout, and session recovery.
- Profile page with bio, post stats, follower count, following count, and follow/unfollow.
- Image post creation with category and caption.
- Home feed with recent/popular sorting and category filtering.
- Like and comment.
- Post detail drawer.
- Browsing history.
- Recommended creators.
- Admin-style analytics route, hidden from the main navigation but still URL-accessible.

## Sources Checked

- Instagram/Meta product news describes Reels, Friends tab, map/location content, DM inbox placement, and location-based discovery: https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/
- TikTok Help Center describes For You as a personalized feed, recommendation explanations, "Not interested", feed refresh, keyword filtering, and topic controls: https://support.tiktok.com/en/getting-started/for-you
- TikTok Help Center describes direct messages, sharing videos through messages, message requests, group chats, stickers, voice messages, read state, and privacy controls: https://support.tiktok.com/en/using-tiktok/messaging-and-notifications/direct-message-settings
- X Help Center describes private bookmarks and distinguishes bookmarks from discoverable lists: https://help.x.com/en/using-x/bookmarks
- X Help Center summarizes common platform capabilities including Direct Messages, Spaces, Communities, long-form posts, video, and creator monetization: https://help.x.com/en/using-x/download-the-x-app
- Facebook/Meta product news describes unified video/Reels publishing and audience controls: https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/
- Facebook Help Center search result for Events describes discovering, planning, responding to events, inviting people, and event privacy: https://www.facebook.com/help/1076296042409786/
- Facebook Help Center search result for Marketplace confirms Marketplace as a common social-commerce surface: https://www.facebook.com/help/1889067784738765

## High-Priority Missing Features

### 1. Save / Bookmark Posts

Mainstream reference:

- X has private bookmarks for saving posts.
- TikTok and Instagram both have saved/favorite style behavior, often with collections.

Current repo gap:

- Users can like posts, but there is no private "save for later" action.
- Browsing history is passive and temporary-feeling; it is not the same as intentional saving.

Why it matters:

- Save/bookmark is a very common social interaction.
- It gives users a private utility action separate from public likes.
- It is relatively small to implement compared with DM or video.

Suggested implementation:

- Add `saved_posts` table: `id`, `user_id`, `post_id`, `created_at`, unique `(user_id, post_id)`.
- Add `POST /posts/{post_id}/save`.
- Add `GET /users/{username}/saved` for own user only.
- Add save count only if desired; private save list can remain user-only.

Priority:

- Very high. Good feature-to-effort ratio.

### 2. Search

Mainstream reference:

- TikTok references search as a way to find videos, effects, hashtags, and sounds before sharing.
- X includes Explore/search-oriented surfaces for topics and interests.
- Instagram and Facebook both rely heavily on discovery surfaces.

Current repo gap:

- Feed can filter by category and sort by recent/popular, but there is no search for users, captions, categories, or posts.

Why it matters:

- Search is fundamental once content grows beyond seed/demo size.
- It makes the app feel more like a real social platform.
- It also helps demonstrate SQL query and indexing work for the course.

Suggested implementation:

- Add search input to home.
- Backend endpoint: `GET /search?q=...&type=posts|users|all`.
- Search post captions, usernames, display names, and category.
- Add indexes where useful.

Priority:

- Very high. This is common, useful, and course-relevant.

### 3. Personalized Feed

Mainstream reference:

- TikTok's For You feed is personalized based on interests and engagement.
- TikTok also exposes controls like "Not interested", keyword filtering, refresh feed, and topic management.
- Instagram/Facebook/X all use recommendation surfaces beyond chronological sorting.

Current repo gap:

- Feed is global: recent/popular/category.
- Recommended creators exist, but posts are not personalized.
- Follow relationships currently do not meaningfully change the feed.

Why it matters:

- Personalization is central to modern social products.
- Even a simple version would make follow/unfollow more meaningful.

Suggested implementation:

- Add feed tabs: `For You`, `Following`, `Recent`.
- `Following`: posts only from followed creators.
- `For You`: weighted score using liked categories, followed creators, recent views, likes, and comments.
- Add "Not interested" to down-rank categories or creators.

Priority:

- Very high, but implement incrementally.

### 4. Notifications / Activity Inbox

Mainstream reference:

- TikTok direct messaging docs mention notification settings and read/active states.
- X and most platforms have notification surfaces for follows, replies/comments, likes, mentions, and messages.

Current repo gap:

- When someone follows, likes, or comments, the target user has no notification.
- Users must manually inspect posts/profiles to know what happened.

Why it matters:

- Notifications are one of the most important engagement loops.
- It gives immediate feedback for social interactions.

Suggested implementation:

- Add `notifications` table: `recipient_user_id`, `actor_user_id`, `type`, `post_id`, `comment_id`, `is_read`, `created_at`.
- Create notifications for follow, like, comment.
- Add `/notifications` page or dropdown.
- Add unread count in nav.

Priority:

- High.

### 5. Post / Comment Ownership Controls

Mainstream reference:

- Large platforms let users manage their own content and control audience/privacy.
- Facebook's Reels update emphasizes audience settings and publishing controls.

Current repo gap:

- Users can create posts and comments, but there is no edit/delete for posts or comments.
- There is no privacy/audience setting.

Why it matters:

- Users need basic control over their own content.
- This is expected even in simple social apps.
- It is also important for demo quality because mistakes in uploaded posts cannot be corrected.

Suggested implementation:

- Add `DELETE /posts/{post_id}` and `PATCH /posts/{post_id}` with ownership check.
- Add `DELETE /comments/{comment_id}` and optional edit.
- Add `visibility` to posts: `public`, `followers`, `private`.

Priority:

- High.

## Medium-Priority Missing Features

### 6. Direct Messages

Mainstream reference:

- TikTok supports DMs, video sharing through DMs, message requests, group chats, stickers, voice messages, read state, and privacy controls.
- X lists private Direct Messages as a core capability.
- Instagram's newer features are tied closely to the DM inbox.

Current repo gap:

- No private user-to-user messaging.
- No way to share a post privately inside the app.

Why it matters:

- DMs are common and important, but full messaging can become complex.
- For this project, a minimal DM could be valuable if scoped tightly.

Suggested implementation:

- Start with simple 1:1 text messages.
- Add `conversations`, `conversation_members`, `messages`.
- Add "Share post to user" later.
- Do not start with group chat, voice messages, typing indicators, or read receipts.

Priority:

- Medium-high. Important, but larger backend/frontend scope.

### 7. Share / Repost

Mainstream reference:

- TikTok and X both support sharing content through messages or platform-specific sharing flows.
- Repost/remix/reshare behavior is common across social platforms.

Current repo gap:

- Posts can be liked/commented, but cannot be reposted, shared to profile, copied as a share link, or sent to another user.

Why it matters:

- Sharing is core to content distribution.
- It creates a second growth loop beyond likes/comments.

Suggested implementation:

- Add "Copy link" first; it is simple and useful.
- Add repost table later: `user_id`, `post_id`, `caption`, `created_at`.
- Feed can show reposts with original attribution.

Priority:

- Medium-high.

### 8. Report / Block / Safety Controls

Mainstream reference:

- TikTok DMs include report/safety handling and privacy controls.
- X supports reporting posts, lists, DMs, and blocking accounts.

Current repo gap:

- No report post/user/comment.
- No block user.
- No moderation queue.

Why it matters:

- Any user-generated content app needs safety controls.
- This is especially relevant if the project is demoed with arbitrary uploads/comments.

Suggested implementation:

- Add report action for posts, comments, and users.
- Add admin-only reports page, accessible by URL only for now.
- Add block table and prevent blocked users from following, messaging, or interacting.

Priority:

- Medium-high.

### 9. Explore / Trending

Mainstream reference:

- X emphasizes staying up to date and following interests.
- TikTok explains recommendation reasons like popularity, recency, followed creators, and similar engagement.
- Instagram/Facebook surface Reels and location-based discovery.

Current repo gap:

- Popular sorting exists, but no dedicated trending/explore page.
- No trending categories, creators, or search suggestions.

Why it matters:

- It helps users discover content beyond the current feed.
- It can reuse existing analytics data.

Suggested implementation:

- Add Explore page with trending categories, top posts this week, fastest-growing creators.
- Use existing analytics service as a base.
- Keep admin analytics separate from user-facing explore.

Priority:

- Medium.

### 10. Stories / Ephemeral Posts

Mainstream reference:

- Instagram and Facebook still use story-style temporary content.
- Instagram's map content includes posts/stories/reels with time-limited visibility.

Current repo gap:

- All posts are permanent feed posts.
- No lightweight temporary content.

Why it matters:

- Stories are common, but they require extra UI patterns and expiry logic.
- This may be less important than search/bookmarks/notifications for this repo.

Suggested implementation:

- Add `stories` table with `expires_at`.
- Show a horizontal story rail above feed.
- Keep creation simple: one image plus optional caption.

Priority:

- Medium-low unless the project wants a more Instagram-like feel.

## Lower-Priority Or Too Large For Now

### Video / Reels

Mainstream reference:

- Meta is consolidating Facebook video publishing around Reels.
- Instagram and TikTok are heavily video-first.

Current repo gap:

- Image-only posts.

Why not immediate:

- Video upload, transcoding, thumbnails, playback performance, storage, and moderation make this much bigger than image posts.

Recommendation:

- Add only if time allows.
- If implemented, start with externally hosted video URL support rather than full video processing.

### Groups / Communities

Mainstream reference:

- X supports Communities around topics and interests.
- Facebook Groups are a major social surface.

Current repo gap:

- No group membership or group-specific posting.

Why not immediate:

- Requires membership rules, group feed, group moderation, and possibly private visibility.

Recommendation:

- Consider after personalized feed/search/notifications.

### Events / Marketplace

Mainstream reference:

- Facebook supports Events and Marketplace.

Current repo gap:

- No event planning or buying/selling flow.

Why not immediate:

- These are platform-expansion features, not core social feed features.

Recommendation:

- Skip unless the project wants a campus events angle.

## Suggested Implementation Roadmap

### Next Small Features

1. Save/bookmark posts.
2. Search users and posts.
3. Edit/delete own posts and comments.

These are common, useful, and relatively contained.

### Next Medium Features

1. Notifications/activity inbox.
2. Following feed and basic For You ranking.
3. Report/block controls.

These improve social depth and trust.

### Larger Features

1. Direct messages.
2. Repost/share.
3. Stories.
4. Video/Reels.
5. Groups/communities.

These should only be started after the smaller core gaps are stable.

## Best Fit For This Repo

The best next feature is probably `Save / Bookmark Posts`, followed by `Search`.

Reason:

- They are common across mainstream social apps.
- They do not require major UI redesign.
- They fit the existing MySQL/FastAPI/React architecture.
- They provide clear demo value.
- They avoid the complexity of full messaging or video systems.
