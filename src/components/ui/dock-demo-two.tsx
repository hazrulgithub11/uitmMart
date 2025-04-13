"use client";

import { useRouter } from "next/navigation"
import { 
  Home, 
  ShoppingCart, 
  User, 
  Heart, 
  Search,
  MessageSquare,
  Bell 
} from "lucide-react"

import { Dock } from "./dock-two"

export function DockDemoTwo() {
  const router = useRouter()

  const navItems = [
    {
      icon: Home,
      label: "Home",
      onClick: () => router.push("/")
    },
    {
      icon: Search,
      label: "Search",
      onClick: () => router.push("/search")
    },
    {
      icon: ShoppingCart,
      label: "Cart",
      onClick: () => router.push("/cart")
    },
    {
      icon: Heart,
      label: "Favorites",
      onClick: () => router.push("/favorites")
    },
    {
      icon: MessageSquare,
      label: "Messages",
      onClick: () => router.push("/messages")
    },
    {
      icon: Bell,
      label: "Notifications",
      onClick: () => router.push("/notifications")
    },
    {
      icon: User,
      label: "Profile",
      onClick: () => router.push("/profile")
    }
  ]

  return (
    <Dock items={navItems} className="fixed top-4 left-0 right-0 z-50" />
  )
} 