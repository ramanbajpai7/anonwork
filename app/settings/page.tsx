"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Bell, Shield, Trash2, LogOut, Key, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    dm: true,
    mentions: true,
  })
  
  // Change password state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  async function handleChangePassword() {
    setPasswordError("")
    setPasswordSuccess("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    setPasswordLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setPasswordSuccess("Password changed successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setShowPasswordDialog(false)
          setPasswordSuccess("")
        }, 2000)
      } else {
        setPasswordError(data.message || "Failed to change password")
      }
    } catch (error) {
      setPasswordError("Network error. Please try again.")
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!authLoading && !user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-8">
              <Settings className="h-8 w-8" />
              Settings
            </h1>

            {/* Notification Settings */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about activity</p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Direct Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                  </div>
                  <Switch 
                    checked={notifications.dm}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, dm: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mention Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                  </div>
                  <Switch 
                    checked={notifications.mentions}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, mentions: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Privacy Settings */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Post Anonymously by Default</Label>
                    <p className="text-sm text-muted-foreground">Your posts won't show your username</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">Let other users message you</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4 border-t border-border">
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Key className="h-4 w-4" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {passwordError && (
                          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{passwordError}</span>
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>{passwordSuccess}</span>
                          </div>
                        )}
                        <div>
                          <Label>Current Password</Label>
                          <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Must be at least 8 characters
                          </p>
                        </div>
                        <div>
                          <Label>Confirm New Password</Label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          disabled={passwordLoading}
                          className="w-full"
                        >
                          {passwordLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>

            {/* Account Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-red-600">Danger Zone</h3>
              <div className="space-y-4">
                <Button variant="outline" onClick={logout} className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Deleting your account will remove your email and login data. Your posts can optionally be kept or deleted.
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

