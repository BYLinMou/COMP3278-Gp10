import { formatDate } from "../lib/format";

export default function HistoryPage({ browsingHistory, onOpenHistoryPost }) {
  return (
    <section className="center-panel">
      <section className="sidebar-card sidebar-card--wide">
        <div className="card-header"><span className="eyebrow">History</span><h2>Recently Viewed</h2></div>
        {browsingHistory.length ? (
          <div className="history-list">
            {browsingHistory.map((entry) => (
              <article key={`${entry.post_id}-${entry.viewed_at}`} className="history-record history-record--with-thumb">
                <img src={entry.image_url} alt={entry.description} />
                <div><strong>@{entry.username}</strong><span>{entry.description}</span><time>{formatDate(entry.viewed_at)}</time></div>
                <button className="ghost-text-button" onClick={() => onOpenHistoryPost(entry.post_id)} type="button">View Post</button>
              </article>
            ))}
          </div>
        ) : <p className="muted-copy">Open posts after logging in and they will appear here.</p>}
      </section>
    </section>
  );
}

