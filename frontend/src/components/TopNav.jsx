import Avatar from "./Avatar";
import { NAV_ITEMS } from "../lib/constants";
import { icons } from "../lib/icons";

export default function TopNav({ currentView, onChange, currentUser, onProfile, onLogout, onToggleTheme, theme }) {
  return (
    <header className="app-topbar">
      <div className="brand-block">
        <p className="eyebrow">HKUgram</p>
        <h1>Social Salon</h1>
      </div>
      <nav className="top-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} className={`nav-icon-button ${currentView === item.id ? "nav-icon-button--active" : ""}`} onClick={() => onChange(item.id)} type="button">
            {icons[item.id]}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="topbar-user">
        <button 
          className="ghost-text-button" 
          onClick={onToggleTheme} 
          type="button" 
          style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {currentUser ? (
          <>
            <button className="user-chip" onClick={() => onProfile(currentUser.username)} type="button">
              <Avatar username={currentUser.username} size="xs" />
              <span>{currentUser.display_name}</span>
            </button>
            <button className="ghost-text-button" onClick={onLogout} type="button">Log out</button>
          </>
        ) : <span className="muted-copy">Guest mode</span>}
      </div>
    </header>
  );
}

