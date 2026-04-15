import { memo } from "react";
import Avatar from "./Avatar";

const SidebarUser = memo(function SidebarUser({ user, onProfile, extra }) {
  return (
    <button className="sidebar-user" onClick={() => onProfile(user.username)} type="button">
      <Avatar username={user.username} size="xs" />
      <div><strong>{user.display_name}</strong><span>@{user.username}</span></div>
      {extra ? <em>{extra}</em> : null}
    </button>
  );
});

export default SidebarUser;

