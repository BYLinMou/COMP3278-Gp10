import { useEffect, useState } from "react";
import {
  createComment,
  createPost,
  createUser,
  getFeed,
  getQuerySchema,
  runSql,
  runTextToSql,
  toggleLike,
} from "./api";

const showcasePrompts = [
  "most liked posts",
  "most active users",
  "recent posts",
  "comments for post 1",
];

function buildDefaultUser() {
  return {
    username: `visitor_${Math.random().toString(36).slice(2, 7)}`,
    display_name: "Gallery Guest",
    bio: "Exploring HKUgram",
  };
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-HK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div className="divider" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="divider" aria-hidden="true" />
    </div>
  );
}

function QueryTable({ result }) {
  if (!result) {
    return <p className="muted-copy">Run a curated prompt or your own read-only SELECT query.</p>;
  }

  return (
    <div className="query-result">
      <div className="query-result__meta">
        <span>{result.title ?? "SQL Result"}</span>
        <span>{result.row_count} rows</span>
      </div>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={`${index}-${JSON.stringify(row)}`}>
                {result.columns.map((column) => (
                  <td key={column}>{String(row[column] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onComment }) {
  const [commentBody, setCommentBody] = useState("");

  return (
    <article className="deco-card feed-card">
      <div className="corner corner--tl" aria-hidden="true" />
      <div className="corner corner--br" aria-hidden="true" />
      <div className="feed-card__head">
        <div className="diamond-badge">
          <span>{post.username.slice(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <h3>{post.display_name}</h3>
          <p>@{post.username}</p>
        </div>
        <time>{formatDate(post.created_at)}</time>
      </div>
      <div className="frame-image">
        <div className="frame-image__inner">
          <img src={post.image_url} alt={post.description} />
        </div>
      </div>
      <p className="feed-card__body">{post.description}</p>
      <div className="feed-card__stats">
        <span>Likes {post.like_count}</span>
        <span>Comments {post.comment_count}</span>
      </div>
      <div className="feed-card__actions">
        <button className="deco-button deco-button--ghost" onClick={() => onLike(post.id, currentUserId)}>
          Like / Unlike
        </button>
      </div>
      <form
        className="comment-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!commentBody.trim()) {
            return;
          }
          onComment(post.id, currentUserId, commentBody);
          setCommentBody("");
        }}
      >
        <label>
          Add Comment
          <input
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="Write a short reply"
          />
        </label>
        <button className="deco-button" type="submit">
          Publish
        </button>
      </form>
    </article>
  );
}

export default function App() {
  const [feed, setFeed] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState("Loading gallery...");
  const [querySchema, setQuerySchema] = useState(null);
  const [queryPrompt, setQueryPrompt] = useState("most liked posts");
  const [sqlText, setSqlText] = useState("SELECT username, display_name FROM users ORDER BY id");
  const [queryResult, setQueryResult] = useState(null);
  const [postForm, setPostForm] = useState({ description: "", image_url: "" });

  async function refreshFeed(nextSort = sortBy) {
    const items = await getFeed(nextSort);
    setFeed(items);
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const user = await createUser(buildDefaultUser());
        setCurrentUser(user);
        const [items, schema] = await Promise.all([getFeed(sortBy), getQuerySchema()]);
        setFeed(items);
        setQuerySchema(schema);
        setStatus(`Signed in as @${user.username}`);
      } catch (error) {
        setStatus(error.message);
      }
    }

    bootstrap();
  }, []);

  async function handleCreatePost(event) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    try {
      await createPost({
        user_id: currentUser.id,
        description: postForm.description,
        image_url: postForm.image_url,
      });
      setPostForm({ description: "", image_url: "" });
      await refreshFeed();
      setStatus("Post published to the marquee.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleLike(postId, userId) {
    try {
      await toggleLike(postId, userId);
      await refreshFeed();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleComment(postId, userId, body) {
    try {
      await createComment(postId, { user_id: userId, body });
      await refreshFeed();
      setStatus("Comment added.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handlePromptRun(prompt) {
    try {
      const result = await runTextToSql(prompt);
      setQueryPrompt(prompt);
      setQueryResult(result);
      setStatus(`Query executed: ${result.title}`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleSqlRun(event) {
    event.preventDefault();
    try {
      const result = await runSql(sqlText);
      setQueryResult({ ...result, title: "Custom SQL" });
      setStatus("Read-only SQL executed.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="page-shell">
      <div className="background-pattern" aria-hidden="true" />
      <header className="hero">
        <div className="hero__sunburst" aria-hidden="true" />
        <div className="hero__content">
          <p className="eyebrow">HKUgram Social Salon</p>
          <h1>Moments Framed In Gold</h1>
          <p className="hero__copy">
            A social media prototype with MySQL persistence, live feed visuals, and a query lounge for
            Text-to-SQL demonstrations.
          </p>
          <div className="hero__meta">
            <span>III Core Systems Online</span>
            <span>{status}</span>
          </div>
          <div className="hero__actions">
            <button className="deco-button" onClick={() => refreshFeed(sortBy)}>
              Refresh Feed
            </button>
            <button className="deco-button deco-button--ghost" onClick={() => handlePromptRun("most active users")}>
              Run Analytics
            </button>
          </div>
        </div>
      </header>

      <main className="layout-grid">
        <section className="deco-panel">
          <SectionHeading
            eyebrow="I. New Post"
            title="Publish A New Tableau"
            subtitle="Create a post with text and an image URL, then watch it appear in the feed."
          />
          <form className="stack-form" onSubmit={handleCreatePost}>
            <label>
              Description
              <textarea
                value={postForm.description}
                onChange={(event) =>
                  setPostForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe the scene"
                required
              />
            </label>
            <label>
              Image URL
              <input
                value={postForm.image_url}
                onChange={(event) => setPostForm((current) => ({ ...current, image_url: event.target.value }))}
                placeholder="https://..."
                required
              />
            </label>
            <button className="deco-button" type="submit">
              Publish Post
            </button>
          </form>
        </section>

        <section className="deco-panel">
          <SectionHeading
            eyebrow="II. Query Lounge"
            title="Text-To-SQL Showcase"
            subtitle="Use preset prompts or a custom read-only SELECT statement to explore the database."
          />
          <div className="prompt-grid">
            {showcasePrompts.map((prompt) => (
              <button
                key={prompt}
                className={`prompt-chip ${queryPrompt === prompt ? "prompt-chip--active" : ""}`}
                onClick={() => handlePromptRun(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <form className="stack-form" onSubmit={handleSqlRun}>
            <label>
              Custom SQL
              <textarea value={sqlText} onChange={(event) => setSqlText(event.target.value)} required />
            </label>
            <button className="deco-button deco-button--ghost" type="submit">
              Execute SELECT
            </button>
          </form>
          <QueryTable result={queryResult} />
          {querySchema ? (
            <div className="schema-block">
              <h3>Available Tables</h3>
              <div className="schema-tags">
                {Object.entries(querySchema.tables).map(([table, columns]) => (
                  <span key={table} className="schema-tag">
                    {table}: {columns.join(", ")}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <section className="feed-section">
        <SectionHeading
          eyebrow="III. Feed Gallery"
          title="Live Feed Visualization"
          subtitle="Sort the feed by time or popularity, view images inline, and interact with posts."
        />
        <div className="feed-toolbar">
          <button
            className={`deco-button ${sortBy === "recent" ? "" : "deco-button--ghost"}`}
            onClick={async () => {
              setSortBy("recent");
              await refreshFeed("recent");
            }}
          >
            Recent
          </button>
          <button
            className={`deco-button ${sortBy === "popular" ? "" : "deco-button--ghost"}`}
            onClick={async () => {
              setSortBy("popular");
              await refreshFeed("popular");
            }}
          >
            Popular
          </button>
        </div>
        <div className="feed-grid">
          {feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
