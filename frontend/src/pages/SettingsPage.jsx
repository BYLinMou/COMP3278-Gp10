import Avatar from "../components/Avatar";
import { demoPassword } from "../lib/format";

export default function SettingsPage({
  currentUser,
  loginForm,
  onLoginSubmit,
  onRegistrationSubmit,
  onSettingsSubmit,
  registration,
  setLoginForm,
  setRegistration,
  setSettingsForm,
  settingsForm,
  users,
}) {
  return (
    <section className="page-grid">
      <section className="page-main">
        <section className="sidebar-card">
          <div className="card-header"><span className="eyebrow">Log In</span><h2>Enter the Community</h2></div>
          <form className="stack-form" onSubmit={onLoginSubmit}>
            <label>Username
              <input value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} required />
            </label>
            <label>Password
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} required />
            </label>
            <button className="primary-pill-button" type="submit">Log In</button>
          </form>
          <p className="muted-copy">Demo passwords follow `username123`, except Sam which uses `sam123456`.</p>
        </section>
        <section className="sidebar-card">
          <div className="card-header"><span className="eyebrow">Profile</span><h2>Edit Current Account</h2></div>
          <form className="stack-form" onSubmit={onSettingsSubmit}>
            <label>Display Name
              <input value={settingsForm.display_name} onChange={(event) => setSettingsForm((current) => ({ ...current, display_name: event.target.value }))} disabled={!currentUser} required />
            </label>
            <label>Bio
              <textarea value={settingsForm.bio} onChange={(event) => setSettingsForm((current) => ({ ...current, bio: event.target.value }))} disabled={!currentUser} />
            </label>
            <label>New Password
              <input type="password" value={settingsForm.password} onChange={(event) => setSettingsForm((current) => ({ ...current, password: event.target.value }))} disabled={!currentUser} placeholder="Leave blank to keep the current password" />
            </label>
            <button className="primary-pill-button" type="submit" disabled={!currentUser}>Save Profile</button>
          </form>
        </section>
      </section>
      <aside className="page-side">
        <section className="sidebar-card">
          <div className="card-header"><span className="eyebrow">Register</span><h2>Create a New Account</h2></div>
          <form className="stack-form" onSubmit={onRegistrationSubmit}>
            <label>Username
              <input value={registration.username} onChange={(event) => setRegistration((current) => ({ ...current, username: event.target.value }))} required />
            </label>
            <label>Password
              <input type="password" value={registration.password} onChange={(event) => setRegistration((current) => ({ ...current, password: event.target.value }))} required />
            </label>
            <label>Display Name
              <input value={registration.display_name} onChange={(event) => setRegistration((current) => ({ ...current, display_name: event.target.value }))} required />
            </label>
            <label>Bio
              <input value={registration.bio} onChange={(event) => setRegistration((current) => ({ ...current, bio: event.target.value }))} />
            </label>
            <button className="primary-pill-button" type="submit">Create Account</button>
          </form>
          <div className="sidebar-list">
            {users.map((user) => (
              <button className="sidebar-user" key={user.id} onClick={() => setLoginForm({ username: user.username, password: demoPassword(user.username) })} type="button">
                <Avatar username={user.username} size="xs" />
                <div><strong>{user.display_name}</strong><span>@{user.username}</span></div>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
