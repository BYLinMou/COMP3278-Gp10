# Render Performance Notes

## Current Conclusion

The current frontend slowness is not caused by one single expensive line. The main bottleneck is the combination of an image-heavy masonry feed, layout recalculation after image load, and broad app-level rerenders from centralized state updates.

The worst user-visible symptom is a slow first paint or temporary black screen before the feed becomes usable. This is consistent with the code path where the app waits for initial feed data, then renders many image cards whose final height is only known after each image loads.

## Confirmed Bottlenecks

### 1. Masonry feed forces expensive layout work

The homepage uses CSS multi-column masonry:

```css
.feed-waterfall {
  column-count: 3;
  column-gap: 1rem;
}
```

This is simple to implement, but it is not cheap for an image feed. When card heights change, the browser has to rebalance the column layout. A grid or virtualized list would be easier for the browser to update predictably.

Impact:

- Every feed refresh can trigger a full feed layout pass.
- Images loading at different times can repeatedly repack the columns.
- The cost grows with the number of posts on the homepage.

Relevant files:

- `frontend/src/styles.css`
- `frontend/src/pages/HomePage.jsx`

### 2. Each image load can trigger a React state update and layout shift

`PostCard` starts every card as `square`, then reads the image's natural dimensions in `onLoad` and updates local state:

```jsx
const [mediaShape, setMediaShape] = useState("square");

onLoad={(event) => {
  const { naturalWidth, naturalHeight } = event.currentTarget;
  ...
  setMediaShape((current) => (current === nextShape ? current : nextShape));
}}
```

This means each image may render once as the default shape, then render again as `landscape`, `portrait`, or `square`. Because those classes change image height, React rerender and browser layout happen together.

Impact:

- One rerender per card after image decode/load.
- Height changes cause layout shift.
- In the multi-column masonry layout, one image height update can affect many card positions.

Relevant file:

- `frontend/src/components/PostCard.jsx`

### 3. Images do not have stable dimensions before loading

The feed image height is currently controlled by CSS classes such as:

```css
.post-tile__media--landscape img {
  height: clamp(190px, 18vw, 240px);
}
```

But the correct shape is not known until image load. There is no `width`, `height`, or server-provided aspect ratio in the post payload. So the browser cannot reserve the correct layout space upfront.

Impact:

- Layout shifts are expected on image-heavy feeds.
- The app feels like it is "settling" after first render.
- Low-end devices or slow image responses will amplify the issue.

Recommended future fix:

- Store `image_width`, `image_height`, or `aspect_ratio` when uploading images.
- Return that metadata from `/feed`.
- Render the correct card shape before the image request finishes.

### 4. App-level controller state causes broad rerenders

Most app state is centralized in `useAppController`, including feed, analytics, users, session, selected post, comments, profile, history, status, category, sort, and recommendations.

This is pragmatic and easy to reason about, but it means many state changes rerender the top-level `App` and recreate page props. `PostCard` is memoized, which helps, but app-level rerenders still affect layout containers, sidebars, and conditional page branches.

Impact:

- Updating status, analytics, session, profile, or recommendation state can rerender the shell.
- The feed is not isolated from non-feed state changes as much as it could be.
- The bigger the app gets, the more this controller becomes a render coordination bottleneck.

Relevant files:

- `frontend/src/hooks/useAppController.js`
- `frontend/src/App.jsx`

### 5. Initial bootstrap still performs several non-visual tasks near startup

The app has already been improved so `/analytics` does not block the homepage in the same way as before. However, startup still does this pattern:

- Load feed or analytics depending on route.
- Schedule follow-up work for users, analytics/feed, session, profile, and history.
- Update status and user state after session recovery.

This is better than loading everything synchronously, but it still creates multiple state updates soon after first paint.

Impact:

- More rerenders shortly after the page becomes visible.
- If backend/API latency is high, the UI can feel unstable while state settles.
- Session recovery can cause profile/history work even when the user only wants to browse the feed.

Relevant file:

- `frontend/src/hooks/useAppController.js`

## Less Important But Still Relevant

### Visual effects are no longer the top suspect

Earlier heavy backgrounds, glows, and blur-like effects were already reduced. The current CSS still has borders, hover transforms, skeleton placeholders, and gradient overlays, but these are not likely the main black-screen cause compared with image layout and repeated feed rendering.

The restored hover image animation is acceptable:

```css
.post-tile:hover .post-tile__media img {
  transform: scale(1.02);
}
```

This uses `transform`, which is generally cheaper than changing layout properties.

### `content-visibility: auto` helps but does not solve first-screen cost

The app uses:

```css
.sidebar-card, .post-tile, .profile-post-card, .history-record {
  content-visibility: auto;
  contain-intrinsic-size: 320px;
}
```

This can reduce offscreen rendering cost, but it does not remove the cost of first-screen cards, image decoding, or masonry reflow.

## Recommended Fix Order

### Priority 1: Persist image aspect ratio

Backend upload should inspect image dimensions and store width/height or aspect ratio. Feed responses should include it.

Expected result:

- No need for `onLoad` shape detection.
- Fewer React rerenders.
- Less layout shift.
- Faster perceived first paint.

### Priority 2: Replace CSS columns with predictable grid layout

Options:

- Use a simple responsive CSS grid with fixed aspect-ratio cards.
- Use a lightweight masonry algorithm that assigns posts to columns in React based on known aspect ratio.
- If the feed grows large, add virtualization or pagination.

Expected result:

- Less browser repacking.
- More predictable render cost.
- Better control over mobile layout.

### Priority 3: Paginate or limit feed size

The current feed fetch renders all returned posts. For a social feed, this should become cursor pagination.

Expected result:

- Lower initial DOM size.
- Faster image scheduling.
- Faster feed updates after like/comment/filter actions.

### Priority 4: Split controller state by page/domain

Keep feed state in a feed-specific hook, profile state in a profile hook, analytics state in an admin/analytics hook, and session state in a lightweight auth hook.

Expected result:

- Updating analytics does not rerender feed internals.
- Profile/history work does not affect the home page as much.
- Easier future optimization.

### Priority 5: Defer non-visible startup tasks more aggressively

After first feed paint, use idle-time or route-triggered loading for analytics/history/profile where possible.

Expected result:

- Less startup contention.
- Better first interaction responsiveness.

## How To Verify

Use Chrome DevTools Performance panel and record:

1. Hard reload on `/`.
2. Filter change between categories.
3. Like a post.
4. Open and close a thread.

Look for:

- Long `Layout` blocks after image loads.
- React commits after each image `onLoad`.
- Large style recalculation under `.feed-waterfall`.
- Multiple app-level commits immediately after startup.

The most useful metric for this project is not only total build size. It is the number and cost of layout recalculations while the image feed is becoming visible.
