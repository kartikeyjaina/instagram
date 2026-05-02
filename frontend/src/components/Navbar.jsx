import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../api/authService";
import { useState, useEffect } from "react";
import { notificationService } from "../api/notificationService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationService.getNotifications()
      .then((notifs) => setUnread(notifs.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (!user) return null;

  const navLinks = [
    { to: "/feed", icon: "🏠", label: "Feed" },
    { to: "/explore", icon: "🔍", label: "Explore" },
    { to: `/profile/${user.id || user._id}`, icon: "👤", label: "Profile" },
    { to: "/messages", icon: "💬", label: "Messages" },
    { to: "/saved", icon: "🔖", label: "Saved" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6"
      style={{ background: "rgba(10,14,39,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
      {/* Logo */}
      <Link to="/feed" className="gradient-text font-black text-xl tracking-tight">
        Nexus
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              location.pathname === link.to
                ? "text-cyan-400 bg-cyan-400/10"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{link.icon}</span>
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        ))}

        {/* Notifications */}
        <Link
          to="/notifications"
          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            location.pathname === "/notifications"
              ? "text-cyan-400 bg-cyan-400/10"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>🔔</span>
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="hidden md:inline">Alerts</span>
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Link to="/create" className="btn-primary text-xs px-4 py-2">+ Post</Link>
        <button onClick={handleLogout} className="btn-ghost text-xs px-3 py-2">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
