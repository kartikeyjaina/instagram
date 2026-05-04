import { Outlet } from "react-router-dom";
import { SocketProvider } from "../context/SocketContext";
import Navbar from "../components/Navbar";

export default function AppLayout() {
  return (
    <SocketProvider>
      <div className="app-layout">
        <Navbar />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </SocketProvider>
  );
}
