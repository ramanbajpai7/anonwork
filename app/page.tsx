import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/layout/header"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header with Logo */}
      <Header showAuthButtons />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">Anonymous Professional Community</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Share insights, ask questions, and connect with professionals in your industry — completely anonymously.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Explore Feed
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Why AnonWork?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "🔒 Completely Anonymous",
                description: "Share your thoughts without revealing your identity. Your privacy is our priority.",
              },
              {
                title: "👥 Professional Network",
                description: "Connect with verified professionals in your field and industry.",
              },
              {
                title: "✓ Verified Insights",
                description: "Trust insights from verified employees at top companies.",
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-background hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 AnonWork. Built for professionals, by professionals.</p>
        </div>
      </footer>
    </main>
  )
}
