import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "../api/authService";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const shortcuts = [
  { to: "/feed", label: "Open feed" },
  { to: "/explore", label: "Explore" },
  { to: "/create", label: "Create post" },
  { to: "/messages", label: "Messages" },
];

export default function Dashboard() {
  const user = authService.getUser();

  return (
    <div className="layout-container page-stack">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card dashboard-hero"
      >
        <div className="stack-sm">
          <p className="field-note">Dashboard</p>
          <h1 className="dashboard-title">
            Welcome back, @{user?.username || "creator"}
          </h1>
          <p className="dashboard-copy">
            Keep the workspace moving from one place with posts, conversations,
            and notifications organized in a clean layout.
          </p>
        </div>
        <div className="stack-sm dashboard-summary">
          <Card className="metric-card">
            <strong>{user?.email || "No email"}</strong>
            <p>Signed in account</p>
          </Card>
          <Card className="metric-card">
            <strong>{user?.username ? `@${user.username}` : "Profile"}</strong>
            <p>Visible to your network</p>
          </Card>
        </div>
      </motion.section>

      <section className="metric-grid">
        {[
          {
            title: "Feed",
            copy: "Browse recent activity and catch up quickly.",
          },
          {
            title: "Explore",
            copy: "Find people and posts across the network.",
          },
          {
            title: "Messages",
            copy: "Keep conversations organized and easy to reach.",
          },
          {
            title: "Notifications",
            copy: "Stay on top of likes, follows, and comments.",
          },
        ].map((item) => (
          <Card key={item.title} className="metric-card">
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </Card>
        ))}
      </section>

      <Card className="stack-md">
        <div className="row-between">
          <div>
            <h2 className="section-heading">Quick actions</h2>
            <p className="page-subtitle">
              Jump straight into the main workflows.
            </p>
          </div>
        </div>
        <div className="row-between dashboard-actions">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.to} to={shortcut.to}>
              <Button variant="secondary">{shortcut.label}</Button>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
