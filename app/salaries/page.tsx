"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, DollarSign, TrendingUp, Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface SalaryData {
  company_name: string
  job_title: string
  level: string
  location: string
  entry_count: number
  avg_base: number
  avg_total: number
  min_total: number
  max_total: number
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCompany, setSearchCompany] = useState("")
  const [searchTitle, setSearchTitle] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    level: "",
    years_experience: "",
    location: "",
    base_salary: "",
    bonus: "",
    stock_annual: "",
  })

  async function fetchSalaries() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchCompany) params.set("company", searchCompany)
      if (searchTitle) params.set("title", searchTitle)
      
      const res = await fetch(`/api/salaries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSalaries(data.salaries || [])
      }
    } catch (error) {
      console.error("Failed to fetch salaries:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalaries()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage(null)
    
    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          base_salary: parseInt(formData.base_salary),
          bonus: formData.bonus ? parseInt(formData.bonus) : 0,
          stock_annual: formData.stock_annual ? parseInt(formData.stock_annual) : 0,
        }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSubmitMessage({ type: "success", text: "Salary submitted successfully! Thank you for contributing." })
        setFormData({ company_name: "", job_title: "", level: "", years_experience: "", location: "", base_salary: "", bonus: "", stock_annual: "" })
        fetchSalaries()
        setTimeout(() => {
          setShowAddModal(false)
          setSubmitMessage(null)
        }, 2000)
      } else {
        setSubmitMessage({ type: "error", text: data.message || "Failed to submit salary" })
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  Salary Data
                </h1>
                <p className="text-muted-foreground mt-1">Anonymous compensation insights from professionals</p>
              </div>
              <Dialog open={showAddModal} onOpenChange={(open) => {
                setShowAddModal(open)
                if (!open) setSubmitMessage(null)
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your Salary
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Share Your Compensation (Anonymously)</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {submitMessage && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        submitMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {submitMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        {submitMessage.text}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Company *</Label>
                        <Input 
                          placeholder="e.g., Google" 
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Job Title *</Label>
                        <Input 
                          placeholder="e.g., Software Engineer" 
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Level</Label>
                        <Input 
                          placeholder="e.g., L5, Senior" 
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Years of Experience</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g., 5" 
                          value={formData.years_experience}
                          onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g., San Francisco, CA" 
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Base Salary * ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="150000" 
                          value={formData.base_salary}
                          onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Annual Bonus ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="30000" 
                          value={formData.bonus}
                          onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Annual Stock ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          value={formData.stock_annual}
                          onChange={(e) => setFormData({ ...formData, stock_annual: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        "Submit Anonymously"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <Card className="p-4 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); fetchSalaries(); }} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Search by company (e.g., Google, Meta)..." 
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    placeholder="Search by job title (e.g., Software Engineer)..." 
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </form>
              {(searchCompany || searchTitle) && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Searching for: {searchCompany && <span className="font-medium">"{searchCompany}"</span>}
                    {searchCompany && searchTitle && " + "}
                    {searchTitle && <span className="font-medium">"{searchTitle}"</span>}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setSearchCompany(""); setSearchTitle(""); fetchSalaries(); }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </Card>

            {/* Results */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                Loading salary data...
              </div>
            ) : salaries.length > 0 ? (
              <div className="space-y-4">
                {salaries.map((salary, i) => (
                  <Card key={i} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{salary.company_name}</span>
                        </div>
                        <h3 className="text-lg font-medium mt-1">{salary.job_title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                          {salary.level && <span className="bg-muted px-2 py-0.5 rounded">{salary.level}</span>}
                          {salary.location && <span className="bg-muted px-2 py-0.5 rounded">{salary.location}</span>}
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{salary.entry_count} {salary.entry_count === 1 ? 'report' : 'reports'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(salary.avg_total)}</div>
                        <div className="text-sm text-muted-foreground">Avg. Total Comp</div>
                        {salary.entry_count > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Range: {formatCurrency(salary.min_total)} - {formatCurrency(salary.max_total)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No salary data found</h3>
                <p className="text-muted-foreground mb-6">Be the first to contribute salary information!</p>
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your Salary
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
