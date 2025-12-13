"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogOut, User, Home, MessageSquare } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface HeaderProps {
  showAuthButtons?: boolean
  rightContent?: React.ReactNode
}

export function Header({ showAuthButtons = false, rightContent }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo - Click to go home */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
              <Image 
                src="/icon.png" 
                alt="AnonWork Logo" 
                width={44} 
                height={44}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="absolute inset-0 gradient-bg rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold gradient-text tracking-tight">
              AnonWork
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase hidden sm:block">
              Speak Freely
            </span>
          </div>
        </Link>

        {/* Right side content */}
        <div className="flex items-center gap-2">
          {rightContent}
          
          {showAuthButtons && !user && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-medium hover:bg-primary/10 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="gradient-bg text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-press"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1">
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Dashboard"
                  className="hover:bg-primary/10 hover:text-primary transition-all duration-200 icon-bounce"
                >
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              
              <NotificationBell />
              
              <Link href="/messages">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Messages" 
                  className="relative hover:bg-primary/10 hover:text-primary transition-all duration-200 icon-bounce"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/profile">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full ml-1 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 cursor-pointer group">
                  <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {user.display_name || user.anon_username}
                  </span>
                </div>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout} 
                title="Sign out"
                className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
