import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/store/notifSlice';
import { updateUserField } from '@/store/authSlice';

let socketInstance: Socket | null = null;

export const useSocket = (token: string | null) => {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io(window.location.origin, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    socketRef.current = socketInstance;
    const socket = socketInstance;

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('❌ Socket disconnected'));

    socket.on('notification:new', (data: any) => {
      dispatch(addNotification(data));
    });

    socket.on('user:online', ({ userId }: { userId: string }) => {
      // Could update online status in a users slice if needed
    });

    return () => {
      socket.off('notification:new');
      socket.off('user:online');
    };
  }, [token, dispatch]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
