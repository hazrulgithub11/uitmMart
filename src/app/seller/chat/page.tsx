"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, ChevronRight, User, Search } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import Chat from '@/components/Chat'

// Cartoon style definitions
const cartoonStyle = { 
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", 
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Chat conversation type
interface ChatConversation {
  id: number;
  buyer: {
    id: number;
    fullName: string;
    profileImage: string | null;
  };
  seller: {
    id: number;
    fullName: string;
    profileImage: string | null;
  };
  shop: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
  messages: {
    id: number;
    content: string;
    createdAt: string;
    read: boolean;
    senderId: number;
  }[];
  lastMessageAt: string;
  unreadCount: number;
}

export default function SellerChatPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null)
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/chat/conversations')
          
          if (response.ok) {
            const data = await response.json()
            setConversations(data)
          }
        } catch (error) {
          console.error('Error fetching conversations:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    fetchConversations()
  }, [status])
  
  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() 
    ? conversations.filter(conversation => 
        conversation.buyer.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;
  
  // Show loading state while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <p className={`${cartoonStyle.heading} text-black`}>Loading conversations...</p>
        </div>
      </div>
    )
  }
  
  // If no chat is selected, show the conversations list
  if (!selectedChat) {
    return (
      <div className="h-full">
        <h1 className={`${cartoonStyle.heading} text-black mb-6`}>Customer Messages</h1>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${cartoonStyle.input} w-full py-2 pl-10 pr-4 text-black`}
            />
          </div>
        </div>
        
        {filteredConversations.length === 0 ? (
          <div className={`${cartoonStyle.card} flex flex-col items-center justify-center py-12`}>
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-xl font-bold text-black mb-2">No conversations yet</p>
            <p className="text-gray-600 mb-6 text-center">
              When customers message you, their conversations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map(conversation => {
              const lastMessage = conversation.messages[0] || null
              const isUnread = conversation.unreadCount > 0
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation)}
                  className={`${cartoonStyle.card} cursor-pointer hover:translate-y-[-4px] transition-all ${isUnread ? 'border-red-500' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="relative rounded-full bg-white border-3 border-black w-12 h-12 flex-shrink-0 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {conversation.buyer.profileImage ? (
                        <Image
                          src={conversation.buyer.profileImage}
                          alt={conversation.buyer.fullName}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-black" />
                      )}
                      
                      {isUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center text-white text-xs font-bold">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-black text-lg">
                          {conversation.buyer.fullName}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {lastMessage && (
                        <p className={`text-sm mt-1 line-clamp-1 ${isUnread ? 'font-bold' : 'text-gray-600'}`}>
                          {lastMessage.senderId === session?.user?.id ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  
  // If a chat is selected, show the chat interface
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setSelectedChat(null)}
          className={`${cartoonStyle.button} p-2 mr-4`}
        >
          <ChevronRight className="h-5 w-5 text-black transform rotate-180" />
        </button>
        <h1 className={`${cartoonStyle.heading} text-black`}>
          Chat with {selectedChat.buyer.fullName}
        </h1>
      </div>
      
      <div className="flex-grow overflow-hidden rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <Chat 
          chatId={selectedChat.id}
          shopName={selectedChat.shop.name}
          shopLogo={selectedChat.shop.logoUrl || undefined}
          receiverId={selectedChat.buyer.id}
        />
      </div>
    </div>
  )
} 