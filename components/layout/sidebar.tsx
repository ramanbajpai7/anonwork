"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Hash, 
  DollarSign, 
  MessageSquare, 
  Bookmark, 
  Building2, 
  Search,
  Star,
  User,
  Settings,
  Bell
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home, color: "from-violet-500 to-purple-500" },
  { href: "/topics", label: "Topics", icon: Hash, color: "from-blue-500 to-cyan-500" },
  { href: "/notifications", label: "Notifications", icon: Bell, color: "from-pink-500 to-rose-500" },
  { href: "/salaries", label: "Salaries", icon: DollarSign, color: "from-emerald-500 to-teal-500" },
  { href: "/reviews", label: "Reviews", icon: Star, color: "from-amber-500 to-orange-500" },
  { href: "/companies", label: "Companies", icon: Building2, color: "from-indigo-500 to-purple-500" },
  { href: "/messages", label: "Messages", icon: MessageSquare, color: "from-cyan-500 to-blue-500" },
  { href: "/bookmarks", label: "Saved", icon: Bookmark, color: "from-rose-500 to-pink-500" },
  { href: "/search", label: "Search", icon: Search, color: "from-slate-500 to-gray-500" },
]

const bottomItems = [
  { href: "/profile", label: "Profile", icon: User, color: "from-violet-500 to-purple-500" },
  { href: "/settings", label: "Settings", icon: Settings, color: "from-slate-500 to-gray-500" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 glass border-r border-border/50 h-[calc(100vh-64px)] sticky top-16">
      {/* Brand accent */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image 
              src="/icon.png" 
              alt="AnonWork" 
              width={32} 
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold">Welcome back!</p>
            <p className="text-xs text-muted-foreground">Explore & connect</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                "hover:translate-x-1",
                isActive 
                  ? "bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${item.color} text-white shadow-md` 
                  : "bg-muted/50 group-hover:bg-muted"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                "hover:translate-x-1",
                isActive 
                  ? "bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                isActive 
                  ? `bg-gradient-to-br ${item.color} text-white shadow-md` 
                  : "bg-muted/50 group-hover:bg-muted"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
