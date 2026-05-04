import { Navigate, Outlet } from "react-router-dom";
import { authService } from "../api/authService";

export default function ProtectedRoute() {
  if (!authService.getToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
