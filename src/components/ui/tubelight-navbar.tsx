"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const { data: session } = useSession()
  const router = useRouter()

  // Function to check if user is authenticated
  const requireAuth = (e: React.MouseEvent, destinationUrl: string) => {
    if (!session && destinationUrl !== '/main') {
      e.preventDefault()
      // Redirect to login with callback URL to return after login
      router.push(`/login?callbackUrl=${encodeURIComponent(destinationUrl)}`)
      return false
    }
    return true
  }

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 flex justify-center z-10 pt-6",
        className
      )}
      style={{ pointerEvents: "none" }}
    >
      <div 
        className="flex items-center gap-3 bg-black/95 border border-zinc-800 backdrop-blur-lg py-2 px-2 rounded-full shadow-lg"
        style={{ pointerEvents: "auto" }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={(e) => {
                // Allow navigation to home page without login
                // But require login for all other nav items
                if (requireAuth(e, item.url)) {
                  setActiveTab(item.name)
                }
              }}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-zinc-800 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full">
                    <div className="absolute w-12 h-6 bg-white/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-white/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 