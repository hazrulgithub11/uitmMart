import { io, Socket } from 'socket.io-client';

// Socket.io server URL - use environment variable or fallback to relative path
// Using relative path allows it to work with the same domain in production
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '/socket.io';

// Socket.io connection options
const socketOptions = {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // Try WebSocket first, then fallback to polling
  path: process.env.NEXT_PUBLIC_SOCKET_PATH || undefined,
};

// Create a socket instance
let socket: Socket | null = null;

// Initialize socket connection
export const initializeSocket = (): Socket => {
  if (!socket) {
    console.log('[SOCKET] Connecting to:', SOCKET_URL);
    socket = io(SOCKET_URL, socketOptions);
    
    // Set up default listeners
    socket.on('connect', () => {
      console.log('[SOCKET] Connected:', socket?.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error);
      // Try to reconnect after error
      setTimeout(() => {
        if (socket) {
          console.log('[SOCKET] Attempting to reconnect...');
          socket.connect();
        }
      }, 5000);
    });
  }
  
  return socket;
};

// Get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Connect to socket with user authentication
export const connectSocket = (userId: number | string, role: string): void => {
  const socket = initializeSocket();
  
  if (socket && !socket.connected) {
    socket.connect();
    
    // Once connected, join with user info
    socket.on('connect', () => {
      socket.emit('join', { userId, role });
    });
  } else if (socket && socket.connected) {
    // If already connected, just join
    socket.emit('join', { userId, role });
  }
};

// Disconnect socket
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

// Join a specific chat room
export const joinChatRoom = (chatId: number): void => {
  if (socket && socket.connected) {
    socket.emit('joinChat', { chatId });
  }
};

// Send a private message
export const sendPrivateMessage = (
  senderId: number | string,
  receiverId: number | string,
  chatId: number | string,
  message: string,
  clientId?: string
): void => {
  if (socket && socket.connected) {
    socket.emit('privateMessage', {
      senderId,
      receiverId,
      chatId,
      message,
      clientId
    });
  }
};

// Send typing indicator
export const sendTypingIndicator = (
  chatId: number,
  userId: number,
  isTyping: boolean
): void => {
  if (socket && socket.connected) {
    socket.emit('typing', { chatId, userId, isTyping });
  }
};

// Mark messages as read
export const markMessagesAsRead = (chatId: number, userId: number): void => {
  if (socket && socket.connected) {
    socket.emit('markAsRead', { chatId, userId });
  }
}; 