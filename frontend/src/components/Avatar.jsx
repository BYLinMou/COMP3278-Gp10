export default function Avatar({ username, size = "md" }) {
  return <div className={`avatar-badge avatar-badge--${size}`}><span>{username.slice(0, 2).toUpperCase()}</span></div>;
}

