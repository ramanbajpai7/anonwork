"use client"

import { useEffect, useState } from "react"
import type { Company } from "@/lib/types"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, Shield, Globe, Loader2, MapPin, Phone, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function CompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  async function fetchCompanies() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/companies?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-blue-500" />
                Companies
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse company channels. Verify your work email to access private discussions.
              </p>
            </div>

            {/* Search */}
            <Card className="p-4 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); fetchCompanies(); }} className="flex gap-4">
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
            </Card>

            {/* Companies Grid */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                Loading companies...
              </div>
            ) : companies.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {companies.map((company) => (
                  <Card key={company.id} className="p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{company.name}</h3>
                          {company.verified && (
                            <Badge variant="secondary" className="gap-1 flex-shrink-0">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          {company.industry && (
                            <Badge variant="outline" className="flex-shrink-0">
                              {company.industry}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Address */}
                        {company.address && (
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{company.address}</span>
                          </div>
                        )}
                        
                        {/* Phone & Website Row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {company.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.website && (
                            <a 
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Website</span>
                            </a>
                          )}
                          {company.domain && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{company.domain}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/companies/${company.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Channel
                        </Button>
                      </Link>
                      {user && !user.is_verified_employee && (
                        <Link href="/profile">
                          <Button size="sm">Verify</Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground">
                  {search ? `No companies matching "${search}"` : "No companies available yet"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
