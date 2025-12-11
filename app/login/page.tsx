import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <Header showAuthButtons />
      <div className="flex flex-col items-center justify-center p-4 pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to share your insights anonymously.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
