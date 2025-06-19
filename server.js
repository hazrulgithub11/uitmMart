const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://uitmmart.site',
      'http://uitmmart.site',
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  path: process.env.SOCKET_PATH || '/socket.io',
});

// Store active users
const activeUsers = new Map();

// Store recent messages
const recentMessages = new Map();

// Configure CORS for Express
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://uitmmart.site',
    'http://uitmmart.site',
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining with their ID
  socket.on('join', async ({ userId, role }) => {
    if (!userId) {
      console.error('Join event missing userId');
      return;
    }
    
    console.log(`User ${userId} joined as ${role}`);
    
    // Store user connection info
    activeUsers.set(userId.toString(), {
      socketId: socket.id,
      role,
      userId,
    });

    // Join user to their personal room for direct messages
    socket.join(`user:${userId}`);
    
    // Emit user online status
    io.emit('userStatus', { userId, status: 'online' });
  });

  // Handle private messages between users
  socket.on('privateMessage', async (data) => {
    try {
      const { senderId, receiverId, message, chatId, clientId } = data;
      
      if (!senderId || !receiverId || !message || !chatId) {
        console.error('[SERVER DEBUG] Missing required data for privateMessage:', data);
        return;
      }
      
      // Convert IDs to numbers to ensure consistency
      const senderIdNum = parseInt(senderId);
      const receiverIdNum = parseInt(receiverId);
      const chatIdNum = parseInt(chatId);
      
      console.log(`[SERVER DEBUG] Processing message from ${senderIdNum} to ${receiverIdNum}: "${message}" (chatId: ${chatIdNum}, clientId: ${clientId || 'none'})`);

      // Check for recent duplicates (prevent double-sends)
      const key = `${senderIdNum}-${message}-${chatIdNum}`;
      if (recentMessages.has(key)) {
        console.log(`[SERVER DEBUG] Preventing duplicate message: ${key}`);
        
        // Get the existing message ID
        const existingMessageId = recentMessages.get(key);
        
        // Send back the existing message ID to the sender
        if (existingMessageId) {
          socket.emit('messageDuplicate', { 
            originalMessageId: existingMessageId,
            clientId
          });
        }
        
        return;
      }

      // Store message in database
      const newMessage = await prisma.chatMessage.create({
        data: {
          content: message,
          senderId: senderIdNum,
          chatId: chatIdNum,
          read: false,
          // Store clientId in metadata if provided
          ...(clientId ? { metadata: { clientId } } : {})
        },
      });
      
      // Store in recent messages cache to prevent duplicates
      recentMessages.set(key, newMessage.id);
      
      // Clean up old messages from cache (after 10 seconds)
      setTimeout(() => {
        recentMessages.delete(key);
      }, 10000);
      
      console.log(`[SERVER DEBUG] Message saved to database with ID: ${newMessage.id}`);

      // Find receiver's socket if they're online
      const receiver = activeUsers.get(receiverIdNum.toString());
      
      // Prepare the message object with clientId if provided
      const messageWithClientId = {
        ...newMessage,
        ...(clientId ? { clientId } : {})
      };
      
      // Emit to sender and receiver
      console.log(`[SERVER DEBUG] Emitting message to sender: ${senderIdNum}`);
      io.to(`user:${senderIdNum}`).emit('newMessage', {
        ...messageWithClientId,
        isMine: true,
      });
      
      if (receiver) {
        console.log(`[SERVER DEBUG] Emitting message to receiver: ${receiverIdNum}`);
        io.to(`user:${receiverIdNum}`).emit('newMessage', {
          ...messageWithClientId,
          isMine: false,
        });
      } else {
        console.log(`[SERVER DEBUG] Receiver ${receiverIdNum} is not online, message will be delivered when they connect`);
      }
    } catch (error) {
      console.error('[SERVER DEBUG] Error handling private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    if (!chatId || !userId) {
      console.error('Missing required data for typing indicator');
      return;
    }
    
    socket.broadcast.to(`chat:${chatId}`).emit('userTyping', {
      chatId,
      userId,
      isTyping,
    });
  });

  // Handle joining specific chat room
  socket.on('joinChat', ({ chatId }) => {
    if (!chatId) {
      console.error('Missing chatId for joinChat');
      return;
    }
    
    socket.join(`chat:${chatId}`);
    console.log(`User joined chat room: ${chatId}`);
  });

  // Handle marking messages as read
  socket.on('markAsRead', async ({ chatId, userId }) => {
    if (!chatId || !userId) {
      console.error('Missing required data for markAsRead');
      return;
    }
    
    try {
      // Update messages in database
      await prisma.chatMessage.updateMany({
        where: {
          chatId: parseInt(chatId),
          senderId: { not: parseInt(userId) },
          read: false,
        },
        data: {
          read: true,
        },
      });

      // Notify users in the chat that messages were read
      io.to(`chat:${chatId}`).emit('messagesRead', { chatId, userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove the disconnected user
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.socketId === socket.id) {
        activeUsers.delete(userId);
        io.emit('userStatus', { userId, status: 'offline' });
        break;
      }
    }
  });
});

// Simple health check endpoint with improved logging
app.get('/health', (req, res) => {
  console.log(`[SERVER] Health check requested from ${req.ip}`);
  res.status(200).send('Socket.io server is running');
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error');
});

const PORT = process.env.SOCKET_PORT || 3001;
const HOST = process.env.SOCKET_HOST || '0.0.0.0'; // Listen on all interfaces in Docker

server.listen(PORT, HOST, () => {
  console.log(`Socket.io server running on ${HOST}:${PORT}`);
}); 