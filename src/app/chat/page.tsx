"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { User, Send, Smile, Paperclip, ArrowLeft, X, Store, AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

// Create a client component that uses useSearchParams
function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shopName = searchParams.get('shop') || ''
  const messageRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Predefined message categories
  const messageCategories = [
    { label: "Product Related", id: "product" },
    { label: "Shipping & Price Related", id: "shipping" },
    { label: "Order Related", id: "order" }
  ]
  
  // Mock chat data
  const initialMessages = shopName ? [
    {
      id: 1,
      sender: 'shop',
      content: 'Thank you for reaching out! How may I help you? :)',
      timestamp: new Date().toISOString(),
      isBot: true
    }
  ] : []
  
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true)
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Handle sending new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isBot: false
    }
    
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    
    // Simulate shop response after delay
    setTimeout(() => {
      const shopResponse = {
        id: Date.now() + 1,
        sender: 'shop',
        content: 'Thank you for your message! A representative will get back to you shortly.',
        timestamp: new Date().toISOString(),
        isBot: true
      }
      setMessages(prev => [...prev, shopResponse])
    }, 1000)
  }
  
  // Handle submitting the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }
  
  // Handle quick message selection
  const handleQuickMessageClick = (category: string) => {
    const newMsg = `I have a question about ${category.toLowerCase()}`
    setNewMessage(newMsg)
    messageRef.current?.focus()
  }
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Chat Header */}
      <div className="fixed top-0 left-0 right-0 bg-zinc-900 z-20">
        <div className="flex items-center p-4 border-b border-zinc-800">
          <button 
            onClick={() => router.back()}
            className="p-2 mr-2 rounded-full hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-zinc-800 w-10 h-10 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900"></div>
            </div>
            <div>
              <h1 className="text-white font-medium">{shopName || 'Shop'}</h1>
              <p className="text-green-500 text-xs">Active now</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Container with top padding adjusted for header */}
      <div className="flex-1 pt-20 pb-24 overflow-y-auto px-4">
        {/* Welcome Banner */}
        {showWelcomeMessage && (
          <div className="bg-amber-50 rounded-lg p-4 mb-6 relative">
            <button 
              onClick={() => setShowWelcomeMessage(false)}
              className="absolute top-2 right-2 text-amber-800"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-medium">Safety Tip:</p>
                <p className="text-amber-700 text-sm">Always chat and complete transactions within Shopee to protect yourself from scams.</p>
                <a href="#" className="text-blue-500 text-sm font-medium mt-1 inline-block">Learn More</a>
              </div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="space-y-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender !== 'user' && (
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0 mr-2 flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div 
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-zinc-800 text-white'
                }`}
              >
                <p>{message.content}</p>
                <div 
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-red-200' : 'text-zinc-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                  {message.isBot && (
                    <span className="ml-1 text-gray-400 italic">
                      Sent by Chat AI Assistant
                    </span>
                  )}
                </div>
              </div>
              
              {message.sender === 'user' && (
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0 ml-2 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {/* Quick message suggestions if no messages yet */}
          {messages.length === 0 && (
            <div className="space-y-4 py-8">
              <p className="text-zinc-400 text-center">Ask your questions or select from below:</p>
              <div className="flex flex-col gap-2">
                {messageCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleQuickMessageClick(category.label)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-md text-left"
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
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button 
            type="button"
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
          >
            <Smile className="h-5 w-5" />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              ref={messageRef}
              placeholder="Type a message here"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full py-2 px-4 rounded-full border border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <button 
            type="button"
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <button 
            type="submit"
            className={`p-2 rounded-full ${
              newMessage.trim() 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-zinc-700 text-zinc-400'
            }`}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Loading chat...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
} 