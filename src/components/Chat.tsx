import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, Send, Smile, Paperclip, Store, X, AlertTriangle } from 'lucide-react';
import { useSocket, ChatMessage as ChatMessageType } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// Extended ChatMessage type with additional properties
interface ExtendedChatMessage extends ChatMessageType {
  isTemp?: boolean;
}

// Cartoon style definitions
const cartoonStyle = { 
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", 
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", 
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", 
  heading: "text-3xl font-extrabold tracking-wide", 
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
};

// Message categories for quick replies
const messageCategories = [
  { label: "Product Related", id: "product" },
  { label: "Shipping & Price Related", id: "shipping" },
  { label: "Order Related", id: "order" }
];

// Types for chat component
interface ChatProps {
  chatId?: number;
  shopId?: number;
  shopName: string;
  shopLogo?: string;
  receiverId?: number;
  onBack?: () => void;
}

// Single chat message component
const ChatMessage = ({ message, currentUserId }: { message: ExtendedChatMessage, currentUserId: number }) => {
  const isMine = message.senderId === currentUserId;
  
  return (
    <div 
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      {!isMine && (
        <div className="h-10 w-10 rounded-full bg-white border-3 border-black flex-shrink-0 mr-2 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Store className="h-5 w-5" />
        </div>
      )}
      
      <div 
        className={`max-w-[70%] border-3 border-black px-4 py-2 ${
          isMine 
            ? 'bg-red-500 text-white rounded-2xl rounded-br-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]' 
            : 'bg-white text-black rounded-2xl rounded-bl-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
        }`}
      >
        <p className="font-medium">{message.content}</p>
        <div 
          className={`text-xs mt-1 font-bold ${
            isMine ? 'text-red-200' : 'text-gray-500'
          }`}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>
      </div>
      
      {isMine && (
        <div className="h-10 w-10 rounded-full bg-white border-3 border-black flex-shrink-0 ml-2 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

// Main Chat component
export default function Chat({
  chatId,
  shopId,
  shopName,
  shopLogo,
  receiverId,
  onBack
}: ChatProps) {
  // Debug props
  console.log('Chat component props:', { chatId, shopId, shopName, receiverId });
  
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [apiMessages, setApiMessages] = useState<ExtendedChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | undefined>(chatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLInputElement>(null);
  
  // Get user info from session
  const userId = session?.user?.id ? parseInt(String(session.user.id)) : undefined;
  const userRole = session?.user?.role || '';
  
  console.log('Chat user info:', { userId, userRole });
  
  // Get socket connection and message handling functions
  const {
    isConnected,
    messages: socketMessages,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    joinChat,
    clearMessages,
    reconnect
  } = useSocket(userId, userRole);
  
  // Combine API and socket messages, removing duplicates
  const allMessages = useMemo(() => {
    // Create a map to store unique messages by their content and timestamp
    const uniqueMessages = new Map<string, ExtendedChatMessage>();
    
    // Process all messages (both API and socket) to identify duplicates
    [...apiMessages, ...socketMessages].forEach(msg => {
      // Create a unique key based on content, sender and approximate timestamp (minute)
      const timestamp = new Date(msg.createdAt).getTime();
      const roundedTimestamp = Math.floor(timestamp / 60000) * 60000; // Round to nearest minute
      const key = `${msg.senderId}-${msg.content}-${roundedTimestamp}`;
      
      // If this is a temporary message and we already have a non-temporary one with same content, skip it
      const existingMsg = uniqueMessages.get(key);
      const currentMsg = msg as ExtendedChatMessage;
      
      if (existingMsg && currentMsg.isTemp && !existingMsg.isTemp) {
        return; // Skip temporary message if we have a real one
      }
      
      // Prefer non-temporary messages or messages with real IDs
      if (!existingMsg || (currentMsg.isTemp === false && existingMsg.isTemp === true)) {
        uniqueMessages.set(key, currentMsg);
      }
    });
    
    // Convert map to array and sort by timestamp
    return Array.from(uniqueMessages.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [apiMessages, socketMessages]);
  
  // Check Socket.io server status
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  const checkSocketServer = useCallback(async () => {
    try {
      setServerStatus('checking');
      const response = await fetch('/api/chat/socket-status');
      
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('Error checking socket server:', error);
      setServerStatus('offline');
    }
  }, []);
  
  // Check socket server status on mount and when connection status changes
  useEffect(() => {
    checkSocketServer();
    
    // If socket disconnects, check server status
    if (!isConnected && userId) {
      const timer = setTimeout(() => {
        checkSocketServer();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, userId, checkSocketServer]);
  
  // Handle manual reconnection
  const handleReconnect = useCallback(() => {
    if (userId && userRole) {
      reconnect();
      checkSocketServer();
    }
  }, [userId, userRole, reconnect, checkSocketServer]);
  
  // Create a new chat if needed
  useEffect(() => {
    const createChatIfNeeded = async () => {
      if (!chatId && shopId && userId) {
        try {
          setIsLoading(true);
          const response = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId }),
          });
          
          if (response.ok) {
            const chat = await response.json();
            setCurrentChatId(chat.id);
          }
        } catch (error) {
          console.error('Error creating chat:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    createChatIfNeeded();
  }, [chatId, shopId, userId]);
  
  // Fetch messages when chat ID is available
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentChatId) {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/chat/messages?chatId=${currentChatId}`);
          
          if (response.ok) {
            const data = await response.json();
            setApiMessages(data);
            
            // Mark messages as read
            if (userId) {
              markAsRead(currentChatId, userId);
            }
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchMessages();
    
    // Join the chat room via socket
    if (currentChatId) {
      joinChat(currentChatId);
      clearMessages(); // Clear previous socket messages
    }
  }, [currentChatId, userId, joinChat, markAsRead, clearMessages]);
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);
  
  // Track socket connection status to prevent duplicate sends
  const prevConnectedRef = useRef(isConnected);
  
  useEffect(() => {
    // Log connection status changes
    if (prevConnectedRef.current !== isConnected) {
      console.log('[CHAT DEBUG] Socket connection status changed:', isConnected);
      prevConnectedRef.current = isConnected;
    }
  }, [isConnected]);
  
  // Handle sending new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChatId || !userId) {
      console.error('Missing required data:', { 
        hasMessage: !!newMessage.trim(), 
        currentChatId, 
        userId 
      });
      return;
    }
    
    // Ensure we have a valid receiverId
    if (!receiverId) {
      console.error('Missing receiverId, cannot send message. Props:', { 
        chatId, 
        shopId, 
        receiverId,
        currentChatId,
        userId,
        userRole
      });
      return;
    }
    
    const messageContent = newMessage.trim();
    console.log('[CHAT DEBUG] Starting to send message:', messageContent);
    
    // Clear input immediately for better UX
    setNewMessage('');
    
    // Create a temporary message object for immediate UI feedback
    const tempId = Date.now();
    const clientId = `temp-${userId}-${tempId}`;
    const tempMessage: ExtendedChatMessage = {
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      chatId: currentChatId,
      senderId: userId,
      read: false,
      isMine: true,
      isTemp: true, // Mark as temporary to identify it later
      clientId // Add a unique client ID to help with deduplication
    };
    
    console.log('[CHAT DEBUG] Created temp message with ID:', tempId, 'clientId:', clientId);
    
    // Add to local messages immediately for better UX
    setApiMessages(prev => {
      // Make sure we're not adding a duplicate message
      const isDuplicate = prev.some(msg => 
        msg.content === messageContent && 
        msg.senderId === userId &&
        Math.abs(new Date(msg.createdAt).getTime() - Date.now()) < 5000
      );
      
      if (isDuplicate) {
        console.log('[CHAT DEBUG] Prevented adding duplicate temp message');
        return prev;
      }
      
      return [...prev, tempMessage];
    });
    
    // CRITICAL FIX: Use a local variable to capture the current connection state
    // This prevents race conditions where the state might change during the function execution
    const currentlyConnected = isConnected;
    
    // Only use one method to send the message
    if (currentlyConnected) {
      console.log('[CHAT DEBUG] Using socket to send message - connection state:', currentlyConnected);
      // Only use socket, not both socket and API
      sendMessage(userId, receiverId, currentChatId, messageContent, clientId);
    } else {
      console.log('[CHAT DEBUG] Using API to send message - connection state:', currentlyConnected);
      // Use API if socket not connected
      sendViaApi(messageContent, currentChatId, tempId, clientId);
    }
  };
  
  // Helper function to send message via API
  const sendViaApi = async (message: string, chatId: number, tempId: number, clientId: string) => {
    console.log('[CHAT DEBUG] sendViaApi called with tempId:', tempId, 'clientId:', clientId);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          content: message,
          clientId // Add client ID for deduplication
        }),
      });
      
      if (response.ok) {
        const serverMessage = await response.json();
        console.log('[CHAT DEBUG] API response received:', serverMessage);
        
        // Replace temporary message with server message
        setApiMessages(prev => {
          console.log('[CHAT DEBUG] Current apiMessages:', prev);
          
          // Check if we already have this message (by ID or content)
          const alreadyExists = prev.some(msg => 
            // Check by ID
            (msg.id === serverMessage.id && !msg.isTemp) ||
            // Or by content and timestamp (within 5 seconds)
            (msg.content === serverMessage.content && 
             msg.senderId === serverMessage.senderId &&
             !msg.isTemp &&
             Math.abs(new Date(msg.createdAt).getTime() - new Date(serverMessage.createdAt).getTime()) < 5000)
          );
          
          if (alreadyExists) {
            console.log('[CHAT DEBUG] Server message already exists, just removing temp');
            // Just remove the temporary message
            return prev.filter(msg => !(msg.id === tempId && msg.isTemp));
          }
          
          // Replace the temporary message with the server message
          return prev.map(msg => {
            if (msg.isTemp && msg.id === tempId) {
              console.log('[CHAT DEBUG] Replacing temp message:', msg.id);
              return { ...serverMessage, isMine: true };
            }
            return msg;
          });
        });
      }
    } catch (error) {
      console.error('Error sending message via API:', error);
    }
  };
  
  // Handle submitting the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (currentChatId && userId) {
      sendTyping(currentChatId, userId, e.target.value.length > 0);
    }
  };
  
  // Handle quick message selection
  const handleQuickMessageClick = (category: string) => {
    const newMsg = `I have a question about ${category.toLowerCase()}`;
    setNewMessage(newMsg);
    messageRef.current?.focus();
  };
  
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      {/* Chat Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b-4 border-black z-20">
        <div className="flex items-center p-4">
          {onBack && (
            <button 
              onClick={onBack}
              className={`${cartoonStyle.button} p-2 mr-2`}
            >
              <X className="h-5 w-5 text-black" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-white border-3 border-black w-10 h-10 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
              {shopLogo ? (
                <Image
                  src={shopLogo}
                  alt={shopName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover text-black"
                />
              ) : (
                <Store className="h-5 w-5 text-black" />
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black"></div>
            </div>
            <div>
              <h1 className={`${cartoonStyle.heading} text-lg text-black`}>{shopName}</h1>
              <p className="text-green-500 text-xs font-bold">Active now</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Container with top padding adjusted for header */}
      <div className="flex-1 pt-24 pb-24 overflow-y-auto px-4">
        {/* Server Status Banner (only show if offline) */}
        {serverStatus === 'offline' && (
          <div className={`${cartoonStyle.card} bg-red-50 mb-6 relative`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-black text-sm font-bold">Connection Issue</p>
                <p className="text-black text-sm">Chat server is currently unavailable.</p>
                <button 
                  onClick={handleReconnect}
                  className="bg-red-500 text-white text-sm font-bold mt-2 px-3 py-1 rounded-md border-2 border-black"
                >
                  Try Reconnecting
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Welcome Banner */}
        {showWelcomeMessage && (
          <div className={`${cartoonStyle.card} bg-amber-50 mb-6 relative`}>
            <button 
              onClick={() => setShowWelcomeMessage(false)}
              className="absolute top-2 right-2 text-black border-2 border-black rounded-full w-6 h-6 flex items-center justify-center hover:bg-amber-100"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-black text-sm font-bold">Safety Tip:</p>
                <p className="text-black text-sm">Always chat and complete transactions within the app to protect yourself from scams.</p>
                <a href="#" className="text-blue-500 text-sm font-bold mt-1 inline-block">Learn More</a>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="space-y-6 text-black">
          {allMessages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              currentUserId={userId || 0} 
            />
          ))}
          
          {/* Typing indicator */}
          {Object.entries(typingUsers).map(([typingUserId, isTyping]) => {
            if (isTyping && parseInt(typingUserId) !== userId) {
              return (
                <div key={`typing-${typingUserId}`} className="flex justify-start">
                  <div className="h-10 w-10 rounded-full bg-white border-3 border-black flex-shrink-0 mr-2 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="bg-white text-black rounded-2xl rounded-bl-none shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] border-3 border-black px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
          
          {/* Quick message suggestions if no messages yet */}
          {allMessages.length === 0 && !isLoading && (
            <div className="space-y-4 py-8">
              <p className="text-black text-center font-bold">Ask your questions or select from below:</p>
              <div className="flex flex-col gap-3">
                {messageCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleQuickMessageClick(category.label)}
                    className={`${cartoonStyle.button} py-3 px-4 text-left w-full text-black`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button 
            type="button"
            className={`${cartoonStyle.button} p-2`}
          >
            <Smile className="h-5 w-5 text-black" />
          </button>
          
          <div className="relative flex-1 text-black">
            <input
              type="text"
              ref={messageRef}
              placeholder="Type a message here"
              value={newMessage}
              onChange={handleTyping}
              className={`${cartoonStyle.input} w-full py-2 px-4`}
              disabled={!currentChatId || isLoading}
            />
          </div>
          
          <button 
            type="button"
            className={`${cartoonStyle.button} p-2`}
          >
            <Paperclip className="h-5 w-5 text-black" />
          </button>
          
          <button 
            type="button"
            onClick={handleSendMessage}
            className={`p-3 rounded-lg ${
              newMessage.trim() && currentChatId && !isLoading
                ? `${cartoonStyle.buttonPrimary} bg-red-500` 
                : 'bg-gray-300 text-gray-500 border-3 border-gray-400'
            }`}
            disabled={!newMessage.trim() || !currentChatId || isLoading}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 