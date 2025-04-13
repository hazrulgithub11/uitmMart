import { Dock } from "@/components/ui/dock-two"
import {
  Home,
  ShoppingCart, 
  User, 
  Heart,
  Package
} from "lucide-react"
import { useRouter } from "next/navigation"

function DockDemo() {
  const router = useRouter()
  
  const items = [
    { 
      icon: Home, 
      label: "Home",
      onClick: () => router.push('/')
    },
    { 
      icon: ShoppingCart, 
      label: "Shop",
      onClick: () => router.push('/shop')
    },
    { 
      icon: User, 
      label: "Account",
      onClick: () => router.push('/account')
    },
    { 
      icon: Heart, 
      label: "Wishlist",
      onClick: () => router.push('/wishlist')
    },
    { 
      icon: Package, 
      label: "Products",
      onClick: () => router.push('/products')
    }
  ]

  return <Dock items={items} className="w-auto" />
}

export { DockDemo } 