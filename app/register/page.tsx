import { RegisterForm } from "@/components/auth/register-form"
import { Header } from "@/components/layout/header"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <Header showAuthButtons />
      <div className="flex flex-col items-center justify-center p-4 pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join AnonWork</h1>
          <p className="text-muted-foreground">Create your anonymous professional account.</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
