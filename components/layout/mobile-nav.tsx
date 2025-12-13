"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Hash, DollarSign, MessageSquare, User } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/topics", label: "Topics", icon: Hash },
  { href: "/salaries", label: "Salary", icon: DollarSign },
  { href: "/messages", label: "DMs", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:scale-95"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full gradient-bg" />
              )}
              
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-primary/20 to-accent/10 shadow-sm" 
                  : "hover:bg-muted/50"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110"
                )} />
              </div>
              
              <span className={cn(
                "transition-all duration-300",
                isActive ? "font-semibold" : "opacity-70"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
