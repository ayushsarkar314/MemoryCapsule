import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket;

    if (user) {
      // Read the access token from localStorage (AuthContext stores it there)
      const token = localStorage.getItem('mc_access_token');
      const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      newSocket = io(SOCKET_URL, {
        query: { userId: user._id },
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('[Socket] Connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [user?._id]); // Only re-run when the user ID changes

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
