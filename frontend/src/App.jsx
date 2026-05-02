import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import SavedPosts from "./pages/SavedPosts";
import Navbar from "./components/Navbar";

// Protected layout — wraps all authenticated pages
function AuthLayout() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <SocketProvider>
      <Navbar />
      <Outlet />
    </SocketProvider>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(17, 24, 39, 0.97)",
            color: "#fff",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            fontSize: "14px",
            fontWeight: "600",
          },
          success: { iconTheme: { primary: "#00d4ff", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ff006e", secondary: "#fff" } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<AuthLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/saved" element={<SavedPosts />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="/"
          element={
            localStorage.getItem("token")
              ? <Navigate to="/feed" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
