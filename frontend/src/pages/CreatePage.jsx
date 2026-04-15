import { CATEGORIES } from "../lib/constants";

export default function CreatePage({ currentUser, postForm, setPostForm, onSubmit }) {
  return (
    <section className="center-panel">
      <section className="sidebar-card sidebar-card--wide">
        <div className="card-header"><span className="eyebrow">Create</span><h2>Publish a New Post</h2></div>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>Category
            <select className="deco-select" value={postForm.category} onChange={(event) => setPostForm((current) => ({ ...current, category: event.target.value }))} disabled={!currentUser}>
              {CATEGORIES.filter((item) => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Caption
            <textarea value={postForm.description} onChange={(event) => setPostForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tell the feed what this moment means..." required disabled={!currentUser} />
          </label>
          <label>Upload Image
            <input type="file" accept="image/*" onChange={(event) => setPostForm((current) => ({ ...current, imageFile: event.target.files?.[0] ?? null }))} required disabled={!currentUser} />
          </label>
          {postForm.imageFile ? <p className="muted-copy">Selected: {postForm.imageFile.name}</p> : null}
          <button className="primary-pill-button" type="submit" disabled={!currentUser}>Publish Now</button>
        </form>
      </section>
    </section>
  );
}

