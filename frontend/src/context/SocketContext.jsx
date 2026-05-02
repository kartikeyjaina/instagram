import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { authService } from "../api/authService";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) return;

    const socket = io("http://localhost:4000", {
      query: { userId: user.id || user._id },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("online_users", (users) => setOnlineUsers(users));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
