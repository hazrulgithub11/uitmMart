"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingCart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Define the conversation type
interface Conversation {
  unreadCount: number;
}

export default function Header() {
  const { data: session, status } = useSession()
  const [unreadMessages, setUnreadMessages] = useState(0)
  
  // Fetch unread message count if user is authenticated
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/chat/conversations')
          if (response.ok) {
            const conversations = await response.json() as Conversation[]
            const totalUnread = conversations.reduce((total: number, conversation: Conversation) => {
              return total + (conversation.unreadCount || 0)
            }, 0)
            setUnreadMessages(totalUnread)
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error)
        }
      }
    }
    
    fetchUnreadMessages()
    
    // Set up interval to periodically check for new messages
    const intervalId = setInterval(fetchUnreadMessages, 60000) // Check every minute
    
    return () => clearInterval(intervalId)
  }, [status])
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b-4 border-black z-20">
      <div className="flex items-center justify-between p-4">
        <Link href="/main" className="flex items-center gap-2">
          <Image 
            src="/images/logo2.png" 
            alt="UiTMMart Logo" 
            width={40} 
            height={40} 
            className="rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          />
          <span className="font-extrabold text-lg hidden sm:block">UiTMMart</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {status === 'authenticated' && (
            <>
              {unreadMessages > 0 && (
                <Link href="/chat/conversations" className="relative">
                  <div className="bg-white border-3 border-black rounded-lg p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <MessageSquare className="h-5 w-5 text-black" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-black">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                </Link>
              )}
              
              <Link href="/cart">
                <div className="bg-white border-3 border-black rounded-lg p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <ShoppingCart className="h-5 w-5 text-black" />
                </div>
              </Link>
            </>
          )}
          
          {status === 'authenticated' ? (
            <Link 
              href={session.user?.role === 'seller' ? '/seller' : '/profile'}
              className="bg-red-500 text-white border-3 border-black rounded-lg px-4 py-2 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {session.user?.role === 'seller' ? 'Seller Dashboard' : 'My Account'}
            </Link>
          ) : (
            <Link 
              href="/login"
              className="bg-red-500 text-white border-3 border-black rounded-lg px-4 py-2 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 