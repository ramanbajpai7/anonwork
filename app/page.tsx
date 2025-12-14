import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Shield, Users, CheckCircle, ArrowRight, MessageCircle, TrendingUp, Lock } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background bg-pattern overflow-hidden">
      {/* Header with Logo */}
      <Header showAuthButtons />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/50 mb-8 fade-in">
          <Image src="/icon.png" alt="AnonWork" width={20} height={20} className="rounded" />
          <span className="text-sm font-medium">The #1 Anonymous Professional Community</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight fade-in stagger-1">
          Speak Freely.
          <br />
          <span className="gradient-text">Stay Anonymous.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
          Share insights, ask honest questions, and connect with professionals across industries — all while keeping your identity completely private.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in stagger-3">
          <Link href="/register">
            <Button size="lg" className="gradient-bg text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 btn-press border-0 text-base px-8 py-6 rounded-xl group">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="glass border-border/50 hover:bg-primary/10 text-base px-8 py-6 rounded-xl transition-all duration-300">
              Explore Community
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto fade-in stagger-4">
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">10K+</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">50K+</p>
            <p className="text-sm text-muted-foreground">Posts Shared</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold gradient-text">100+</p>
            <p className="text-sm text-muted-foreground">Companies</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">AnonWork</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for professionals who value honest conversations and real insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Lock,
                title: "100% Anonymous",
                description: "Your identity is never revealed. Share freely without fear.",
                color: "from-blue-600 to-blue-700",
              },
              {
                icon: Users,
                title: "Verified Network",
                description: "Connect with verified employees from top companies worldwide.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: MessageCircle,
                title: "Real Conversations",
                description: "Engage in honest discussions about salaries, culture, and more.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: TrendingUp,
                title: "Career Insights",
                description: "Get authentic salary data and company reviews from insiders.",
                color: "from-amber-500 to-orange-500",
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group p-6 rounded-2xl glass border border-border/50 card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:gradient-text transition-all">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl glass border border-border/50 p-8 lg:p-12 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Join the Community?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Start sharing and connecting with professionals today. It's completely free and takes less than a minute to sign up.
              </p>
              <Link href="/register">
                <Button size="lg" className="gradient-bg text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 btn-press border-0 text-base px-10 py-6 rounded-xl">
                  Create Your Anonymous Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 glass">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/icon.png" alt="AnonWork Logo" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold gradient-text">AnonWork</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 AnonWork. Built for professionals, by professionals.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
