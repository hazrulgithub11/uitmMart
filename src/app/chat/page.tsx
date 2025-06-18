"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Chat from '@/components/Chat'

// Interface for Chat object
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

// Cartoon style for loading state
const cartoonStyle = { 
  heading: "text-3xl font-extrabold tracking-wide"
};

// Create a client component that uses useSearchParams
function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // Get shop information from query params
  const shopId = searchParams.get('shopId') ? parseInt(searchParams.get('shopId') || '0') : undefined
  const shopName = searchParams.get('shop') || 'Shop'
  const shopLogo = searchParams.get('logo') || undefined
  const chatId = searchParams.get('chatId') ? parseInt(searchParams.get('chatId') || '0') : undefined
  const receiverId = searchParams.get('receiverId') ? parseInt(searchParams.get('receiverId') || '0') : undefined
  
  // State to store seller ID if needed
  const [sellerId, setSellerId] = useState<number | undefined>(receiverId)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch seller ID if we have chatId but no receiverId
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (chatId && session?.user?.id) {
        try {
          setIsLoading(true)
          setError(null)
          console.log('Fetching chat details for chatId:', chatId)
          
          const response = await fetch(`/api/chat/conversations`);
          if (!response.ok) {
            throw new Error(`Failed to fetch conversations: ${response.status}`)
          }
          
          const conversations = await response.json();
          console.log('Conversations:', conversations)
          
          const currentChat = conversations.find((chat: ChatConversation) => chat.id === chatId);
          console.log('Current chat:', currentChat)
          
          if (currentChat) {
            // If user is buyer, set receiverId to seller's ID
            if (session.user.role === 'buyer') {
              console.log('Setting sellerId to seller.id:', currentChat.seller.id)
              setSellerId(currentChat.seller.id);
            } 
            // If user is seller, set receiverId to buyer's ID
            else if (session.user.role === 'seller') {
              console.log('Setting sellerId to buyer.id:', currentChat.buyer.id)
              setSellerId(currentChat.buyer.id);
            }
          } else {
            console.error('Chat not found in conversations')
            setError('Chat not found')
          }
        } catch (error) {
          console.error('Error fetching chat details:', error);
          setError('Failed to load chat details')
        } finally {
          setIsLoading(false)
        }
      } else if (shopId && session?.user?.role === 'buyer') {
        // If we have shopId but no chatId, we'll create a new chat
        // In this case, we need to fetch the shop details to get the seller ID
        try {
          setIsLoading(true)
          setError(null)
          console.log('Fetching shop details for shopId:', shopId)
          
          const response = await fetch(`/api/public/shops/${shopId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch shop: ${response.status}`)
          }
          
          const shop = await response.json();
          console.log('Shop details:', shop)
          
          if (shop && shop.sellerId) {
            console.log('Setting sellerId from shop:', shop.sellerId)
            setSellerId(shop.sellerId);
          } else {
            console.error('Shop or seller not found')
            setError('Shop information not available')
          }
        } catch (error) {
          console.error('Error fetching shop details:', error);
          setError('Failed to load shop details')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    };
    
    if (status === 'authenticated') {
      fetchChatDetails();
    }
  }, [chatId, shopId, session?.user?.id, session?.user?.role, status]);
  
  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.href))
    }
  }, [status, router])
  
  // Show loading state while checking authentication or fetching data
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <p className={`${cartoonStyle.heading} text-black`}>Loading chat...</p>
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
  
  // Show error state
  if (error) {
  return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center flex-col gap-4">
        <p className={`${cartoonStyle.heading} text-black`}>{error}</p>
          <button 
            onClick={() => router.back()}
          className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2"
          >
          Go Back
          </button>
      </div>
    )
  }
  
  // Redirect if no shop information is provided
  if (!shopId && !chatId) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center flex-col gap-4">
        <p className={`${cartoonStyle.heading} text-black`}>Missing shop information</p>
            <button 
          onClick={() => router.back()}
          className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2"
            >
          Go Back
            </button>
              </div>
    )
  }
  
  // Ensure we have a valid receiverId before rendering the chat
  if (!sellerId) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center flex-col gap-4">
        <p className={`${cartoonStyle.heading} text-black`}>Unable to determine recipient</p>
                  <button
          onClick={() => router.back()}
          className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2"
                  >
          Go Back
                  </button>
      </div>
    )
  }
  
  console.log('Rendering Chat with receiverId:', sellerId)
  
  return (
    <Chat 
      chatId={chatId}
      shopId={shopId}
      shopName={shopName}
      shopLogo={shopLogo}
      receiverId={sellerId}
      onBack={() => router.back()}
    />
  )
}

// Main component with Suspense boundary
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <p className={`${cartoonStyle.heading} text-black`}>Loading chat...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
} 