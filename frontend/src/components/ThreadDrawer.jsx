import { memo, useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import CommentList from "./CommentList";
import { formatDate } from "../lib/format";
import { icons } from "../lib/icons";

const ThreadDrawer = memo(function ThreadDrawer({ currentUser, post, comments, onComment, onClose, onLike, onProfile }) {
  const [draft, setDraft] = useState("");
  const [likeAnimationSeed, setLikeAnimationSeed] = useState(0);
  const [likeBurstSeed, setLikeBurstSeed] = useState(0);
  const [isLikeBurstVisible, setIsLikeBurstVisible] = useState(false);
  const lastImageTapAtRef = useRef(0);
  const likeBurstTimeoutRef = useRef(0);
  const isLiked = Boolean(post?.liked_by_viewer);

  useEffect(() => {
    setDraft("");
    setIsLikeBurstVisible(false);
    lastImageTapAtRef.current = 0;
    window.clearTimeout(likeBurstTimeoutRef.current);
  }, [post?.id]);

  useEffect(() => () => {
    window.clearTimeout(likeBurstTimeoutRef.current);
  }, []);

  const triggerLikeAnimation = useCallback(() => {
    setLikeAnimationSeed((current) => current + 1);
  }, []);

  const triggerLikeBurst = useCallback(() => {
    window.clearTimeout(likeBurstTimeoutRef.current);
    setLikeBurstSeed((current) => current + 1);
    setIsLikeBurstVisible(true);
    likeBurstTimeoutRef.current = window.setTimeout(() => {
      setIsLikeBurstVisible(false);
    }, 820);
  }, []);

  const requestLike = useCallback(async ({ intent = "toggle", celebrate = false } = {}) => {
    if (!post) return null;

    const likeResult = await onLike(post.id, currentUser?.id, {
      currentLiked: isLiked,
      currentLikeCount: post.like_count,
      intent,
      postOwnerUsername: post.username,
    });

    if (likeResult?.liked) {
      triggerLikeAnimation();
      if (celebrate) {
        triggerLikeBurst();
      }
    }

    return likeResult;
  }, [currentUser?.id, isLiked, onLike, post, triggerLikeAnimation, triggerLikeBurst]);

  const handleLikeButtonClick = useCallback(async () => {
    await requestLike();
  }, [requestLike]);

  const handleImageLike = useCallback(async () => {
    if (!currentUser || !post || isLiked) return;
    await requestLike({ intent: "like", celebrate: true });
  }, [currentUser, isLiked, post, requestLike]);

  const handleImagePointerUp = useCallback(async (event) => {
    if (!currentUser) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const now = Date.now();
    if (now - lastImageTapAtRef.current <= 280) {
      lastImageTapAtRef.current = 0;
      await handleImageLike();
      return;
    }

    lastImageTapAtRef.current = now;
  }, [currentUser, handleImageLike]);

  const handleImageKeyDown = useCallback(async (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    await handleImageLike();
  }, [handleImageLike]);

  if (!post) return null;

  const threadImageContent = (
    <>
      <img src={post.image_url} alt={post.description} />
      {currentUser && !isLiked ? <span className="thread-image-hint">Double-click photo to like</span> : null}
      {isLikeBurstVisible ? (
        <div className="thread-like-burst" key={likeBurstSeed} aria-hidden="true">
          <span className="thread-like-burst__diamond" />
          <span className="thread-like-burst__heart">{icons.heartFilled}</span>
          <span className="thread-like-burst__line thread-like-burst__line--1" />
          <span className="thread-like-burst__line thread-like-burst__line--2" />
          <span className="thread-like-burst__line thread-like-burst__line--3" />
          <span className="thread-like-burst__line thread-like-burst__line--4" />
        </div>
      ) : null}
    </>
  );

  return (
    <div className="thread-overlay" onClick={onClose}>
      <aside className="thread-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="thread-drawer__header">
          <div>
            <span className="eyebrow">Post Detail</span>
            <h2>Open Thread</h2>
          </div>
          <button className="ghost-text-button" onClick={onClose} type="button">Close</button>
        </div>
        <button className="author-row author-row--thread" onClick={() => onProfile(post.username)} type="button">
          <Avatar username={post.username} size="md" />
          <div className="author-row__meta">
            <strong>{post.display_name}</strong>
            <span>@{post.username}</span>
          </div>
          <time>{formatDate(post.created_at)}</time>
        </button>
        {currentUser ? (
          <button
            aria-label={isLiked ? "Post image already liked" : "Double-click or press Enter to like this post"}
            className={`thread-image-wrap thread-image-wrap--interactive ${isLiked ? "thread-image-wrap--liked" : ""}`}
            onKeyDown={handleImageKeyDown}
            onPointerUp={handleImagePointerUp}
            type="button"
          >
            {threadImageContent}
          </button>
        ) : (
          <div className="thread-image-wrap">
            {threadImageContent}
          </div>
        )}
        <div className="thread-post-meta">
          <span className="post-chip">{post.category}</span>
          <div className="thread-post-stats"><span>{post.like_count} likes</span><span>{post.comment_count} comments</span></div>
        </div>
        <div className="thread-post-actions">
          <button
            aria-label={isLiked ? "Unlike post" : "Like post"}
            aria-pressed={isLiked}
            className={`icon-action thread-like-button ${isLiked ? "icon-action--active" : ""}`}
            disabled={!currentUser}
            onClick={handleLikeButtonClick}
            type="button"
          >
            <span
              className={`icon-action__icon-shell ${isLiked && likeAnimationSeed ? "icon-action__icon-shell--pulse" : ""}`}
              key={`${isLiked ? "liked" : "idle"}-${likeAnimationSeed}`}
            >
              {isLiked ? icons.heartFilled : icons.heart}
            </span>
            <span>{isLiked ? "Liked" : "Like"}</span>
          </button>
          {!currentUser ? <span className="thread-post-hint">Log in to like posts.</span> : null}
        </div>
        <p className="thread-body">{post.description}</p>
        <form
          className="stack-form thread-form"
          onSubmit={(event) => {
            event.preventDefault();
            onComment(draft, () => setDraft(""));
          }}
        >
          <label>
            Add Comment
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={currentUser ? "Write something thoughtful..." : "Log in to comment"} disabled={!currentUser} required />
          </label>
          <button className="primary-pill-button" type="submit" disabled={!currentUser}>Post Comment</button>
        </form>
        <CommentList comments={comments} onProfile={onProfile} />
      </aside>
    </div>
  );
});

export default ThreadDrawer;
