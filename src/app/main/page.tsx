"use client"

import { Home, Search, Bell, User } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export default function MainPage() {
  const navItems = [
    { name: 'Home', url: '/main', icon: Home },
    { name: 'Search', url: '/search', icon: Search },
    { name: 'Notifications', url: '/notifications', icon: Bell },
    { name: 'Profile', url: '/profile', icon: User }
  ]

  return (
    <main className="min-h-screen">
      <NavBar items={navItems} />
    </main>
  )
}
