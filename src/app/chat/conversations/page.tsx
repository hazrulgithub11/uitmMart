"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Store, MessageSquare, ChevronRight, User, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

// Cartoon style definitions
const cartoonStyle = { 
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", 
  heading: "text-3xl font-extrabold tracking-wide"
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

export default function ConversationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
  
  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))
    }
  }, [status, router])
  
  // Handle chat selection
  const handleChatSelect = (conversation: ChatConversation) => {
    const userRole = session?.user?.role || 'buyer'
    const receiverId = userRole === 'buyer' ? conversation.seller.id : conversation.buyer.id
    
    router.push(`/chat?chatId=${conversation.id}&shop=${encodeURIComponent(conversation.shop.name)}&receiverId=${receiverId}${conversation.shop.logoUrl ? `&logo=${encodeURIComponent(conversation.shop.logoUrl)}` : ''}`)
  }

  // Handle back button click
  const handleBackClick = () => {
    router.back()
  }
  
  // Show loading state while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="animate-pulse">
          <p className={`${cartoonStyle.heading} text-black`}>Loading conversations...</p>
        </div>
      </div>
    )
  }
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <p className={`${cartoonStyle.heading} text-black`}>Please log in to continue</p>
      </div>
    )
  }
  
  const userRole = session?.user?.role || 'buyer'
  const userId = session?.user?.id ? parseInt(String(session.user.id)) : 0
  
  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8 text-black">
          <button 
            onClick={handleBackClick} 
            className={`${cartoonStyle.button} p-2 mr-4`}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className={`${cartoonStyle.heading} text-black text-center flex-1`}>Your Conversations</h1>
        </div>
        
        {conversations.length === 0 ? (
          <div className={`${cartoonStyle.card} flex flex-col items-center justify-center py-12`}>
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-xl font-bold text-black mb-2">No conversations yet</p>
            <p className="text-gray-600 mb-6 text-center">
              {userRole === 'buyer' 
                ? "Visit a shop and start a conversation with a seller" 
                : "Wait for buyers to contact you about your products"}
            </p>
            {userRole === 'buyer' && (
              <button
                onClick={() => router.push('/shoplist')}
                className={`${cartoonStyle.button} py-3 px-6 text-black font-bold`}
              >
                Browse Shops
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map(conversation => {
              const otherUser = userRole === 'buyer' ? conversation.seller : conversation.buyer
              const lastMessage = conversation.messages[0] || null
              const isUnread = conversation.unreadCount > 0
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleChatSelect(conversation)}
                  className={`${cartoonStyle.card} cursor-pointer hover:translate-y-[-4px] transition-all ${isUnread ? 'border-red-500' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="relative rounded-full bg-white border-3 border-black w-12 h-12 flex-shrink-0 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {userRole === 'buyer' ? (
                        conversation.shop.logoUrl ? (
                          <Image
                            src={conversation.shop.logoUrl}
                            alt={conversation.shop.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <Store className="h-6 w-6 text-black" />
                        )
                      ) : (
                        otherUser.profileImage ? (
                          <Image
                            src={otherUser.profileImage}
                            alt={otherUser.fullName}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-black" />
                        )
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
                          {userRole === 'buyer' ? conversation.shop.name : otherUser.fullName}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {lastMessage && (
                        <p className={`text-sm mt-1 line-clamp-1 ${isUnread ? 'font-bold' : 'text-gray-600'}`}>
                          {lastMessage.senderId === userId ? 'You: ' : ''}
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
    </div>
  )
} 