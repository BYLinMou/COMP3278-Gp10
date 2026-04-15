import Avatar from "./Avatar";
import { formatDate } from "../lib/format";

export default function CommentList({ comments, onProfile }) {
  if (!comments.length) return <p className="muted-copy">No comments yet.</p>;
  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <article className="comment-item" key={comment.id}>
          <button className="author-row author-row--comment" onClick={() => onProfile(comment.username)} type="button">
            <Avatar username={comment.username} size="xs" />
            <div className="author-row__meta">
              <strong>{comment.display_name}</strong>
              <span>@{comment.username}</span>
            </div>
            <time>{formatDate(comment.created_at)}</time>
          </button>
          <p>{comment.body}</p>
        </article>
      ))}
    </div>
  );
}

