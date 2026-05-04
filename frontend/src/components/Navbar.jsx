import { Link, NavLink, useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import Button from "./ui/Button";

function Navbar() {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (!user) return null;

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/feed", label: "Feed" },
    { to: "/explore", label: "Explore" },
    { to: "/messages", label: "Messages" },
    { to: "/notifications", label: "Alerts" },
    { to: "/saved", label: "Saved" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="navbar-brand-mark">I</span>
          <span className="navbar-brand-name">
            <strong>Instagram 2.0</strong>
            <span>Workspace</span>
          </span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `navbar-link ${isActive ? "navbar-link-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar-user">
          <div className="navbar-user-meta">
            <strong>@{user.username}</strong>
            <span>{user.email}</span>
          </div>
          <Link to={`/profile/${user.id || user._id}`} className="navbar-link">
            Profile
          </Link>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
