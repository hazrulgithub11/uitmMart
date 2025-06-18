import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  initializeSocket,
  connectSocket,
  disconnectSocket,
  joinChatRoom,
  sendPrivateMessage,
  sendTypingIndicator,
  markMessagesAsRead
} from '@/lib/socketConfig';

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  read: boolean;
  chatId: number;
  senderId: number;
  isMine?: boolean;
  clientId?: string;
}

export interface TypingIndicator {
  chatId: number;
  userId: number;
  isTyping: boolean;
}

export interface UserStatus {
  userId: number;
  status: 'online' | 'offline';
}

export const useSocket = (userId?: number, role?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});
  const typingTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const recentlyReceivedMessages = useRef<Map<string, number>>(new Map());
  
  // Initialize socket connection
  useEffect(() => {
    if (userId && role) {
      const socketInstance = initializeSocket();
      setSocket(socketInstance);
      
      // Connect with user info
      connectSocket(userId, role);
      
      // Set up reconnection logic
      const reconnectInterval = setInterval(() => {
        if (!socketInstance.connected && reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
          reconnectAttempts.current += 1;
          connectSocket(userId, role);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          clearInterval(reconnectInterval);
        }
      }, 10000); // Try to reconnect every 10 seconds
      
      return () => {
        clearInterval(reconnectInterval);
        disconnectSocket();
      };
    }
  }, [userId, role]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Connection status
    const handleConnect = () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    // Message handlers
    const handleNewMessage = (message: ChatMessage) => {
      console.log('[SOCKET DEBUG] New message received:', message);
      
      // Check for duplicates before adding
      setMessages(prev => {
        // More robust duplicate check with multiple criteria
        const isDuplicate = prev.some(m => {
          // Check by ID (most reliable)
          const idMatch = m.id === message.id;
          
          // Check by content and timestamp (within 5 seconds)
          const contentMatch = 
            m.content === message.content && 
            m.senderId === message.senderId &&
            m.chatId === message.chatId &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000;
          
          // Check by client ID if available
          const clientIdMatch = m.clientId && message.clientId && 
                               m.clientId === message.clientId;
            
          if (idMatch) console.log('[SOCKET DEBUG] Duplicate detected by ID:', message.id);
          if (contentMatch) console.log('[SOCKET DEBUG] Duplicate detected by content match:', message.content);
          if (clientIdMatch) console.log('[SOCKET DEBUG] Duplicate detected by client ID');
          
          return idMatch || contentMatch || clientIdMatch;
        });
        
        if (isDuplicate) {
          console.log('[SOCKET DEBUG] Duplicate message not added:', message);
          return prev;
        }
        
        // Store recently received messages to help with deduplication
        const timestamp = Date.now();
        const key = `${message.senderId}-${message.content}`;
        recentlyReceivedMessages.current.set(key, timestamp);
        
        // Clean up old entries from recentlyReceivedMessages
        const fiveSecondsAgo = timestamp - 5000;
        recentlyReceivedMessages.current.forEach((time, key) => {
          if (time < fiveSecondsAgo) {
            recentlyReceivedMessages.current.delete(key);
          }
        });
        
        console.log('[SOCKET DEBUG] Adding new message to state:', message);
        return [...prev, message];
      });
    };

    // Store the current typingTimeoutRef at the time this effect runs
    // This ensures we're using a stable reference in the cleanup function
    const currentTypingTimeouts = typingTimeoutRef.current;

    // Typing indicator handler
    const handleUserTyping = ({ userId, isTyping }: TypingIndicator) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
      
      // Clear typing indicator after 3 seconds of inactivity
      if (isTyping && currentTypingTimeouts[userId]) {
        clearTimeout(currentTypingTimeouts[userId]);
      }
      
      if (isTyping) {
        currentTypingTimeouts[userId] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    };

    // User status handler
    const handleUserStatus = ({ userId, status }: UserStatus) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: status === 'online'
      }));
    };

    // Messages read handler
    const handleMessagesRead = ({ chatId, userId }: { chatId: number, userId: number }) => {
      setMessages(prev => 
        prev.map(message => 
          message.chatId === chatId && message.senderId === userId
            ? { ...message, read: true }
            : message
        )
      );
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStatus', handleUserStatus);
    socket.on('messagesRead', handleMessagesRead);
    
    // Handle reconnect event
    socket.io.on('reconnect', () => {
      console.log('Socket reconnected');
      if (userId && role) {
        socket.emit('join', { userId, role });
      }
    });

    // Clean up event listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStatus', handleUserStatus);
      socket.off('messagesRead', handleMessagesRead);
      socket.io.off('reconnect');
      
      // Clear typing timeouts using the same reference captured when the effect ran
      Object.values(currentTypingTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [socket, userId, role]);

  // Join a chat room
  const joinChat = useCallback((chatId: number) => {
    if (chatId) {
      console.log('Joining chat room:', chatId);
      joinChatRoom(chatId);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((
    senderId: number,
    receiverId: number,
    chatId: number,
    content: string,
    clientId?: string
  ) => {
    console.log('[SOCKET DEBUG] Sending message via socket:', { senderId, receiverId, chatId, content, clientId });
    sendPrivateMessage(senderId, receiverId, chatId, content, clientId);
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((
    chatId: number,
    userId: number,
    isTyping: boolean
  ) => {
    sendTypingIndicator(chatId, userId, isTyping);
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((chatId: number, userId: number) => {
    markMessagesAsRead(chatId, userId);
  }, []);

  // Clear messages (e.g., when changing chats)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Reconnect to socket
  const reconnect = useCallback(() => {
    if (userId && role) {
      connectSocket(userId, role);
    }
  }, [userId, role]);

  return {
    socket,
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    joinChat,
    sendMessage,
    sendTyping,
    markAsRead,
    clearMessages,
    reconnect
  };
}; 