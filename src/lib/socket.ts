import { io, Socket } from "socket.io-client";
import { queryClient } from "./api/query-hooks";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "/";

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Connected to Realtime Socket:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Realtime Socket");
  });

  // Example generic invalidation listener (could be refined depending on backend emits)
  socket.on("invalidate", (queryKey: string | string[]) => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
  });

  socket.on("notification", (payload) => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  socket.on("task:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  });

  socket.on("leave:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
  });

  socket.on("attendance:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["attendance"] });
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
