import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../api/authService";

export default function AuthLayout() {
  if (authService.getToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-shell">
      <Outlet />
    </div>
  );
}
