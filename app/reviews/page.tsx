"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Star, Building2, ThumbsUp, ThumbsDown, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "" : "hover:scale-110 transition-transform cursor-pointer"}`}
        >
          <Star className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchCompany, setSearchCompany] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    employment_status: "current",
    overall_rating: 0,
    culture_rating: 0,
    leadership_rating: 0,
    compensation_rating: 0,
    worklife_rating: 0,
    growth_rating: 0,
    pros: "",
    cons: "",
  })

  async function fetchReviews() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchCompany) params.set("company", searchCompany)
      
      const res = await fetch(`/api/reviews?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.company_name || !formData.overall_rating) {
      setSubmitMessage({ type: "error", text: "Company name and overall rating are required" })
      return
    }
    
    setSubmitting(true)
    setSubmitMessage(null)
    
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSubmitMessage({ type: "success", text: "Review submitted successfully! Thank you for sharing." })
        setFormData({
          company_name: "", job_title: "", employment_status: "current",
          overall_rating: 0, culture_rating: 0, leadership_rating: 0,
          compensation_rating: 0, worklife_rating: 0, growth_rating: 0,
          pros: "", cons: "",
        })
        fetchReviews()
        setTimeout(() => {
          setShowAddModal(false)
          setSubmitMessage(null)
        }, 2000)
      } else {
        setSubmitMessage({ type: "error", text: data.message || "Failed to submit review" })
      }
    } catch (error) {
      setSubmitMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Star className="h-8 w-8 text-yellow-500" />
                  Company Reviews
                </h1>
                <p className="text-muted-foreground mt-1">Anonymous reviews from employees</p>
              </div>
              <Dialog open={showAddModal} onOpenChange={(open) => {
                setShowAddModal(open)
                if (!open) setSubmitMessage(null)
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Write a Company Review</DialogTitle>
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
                        <Label>Job Title</Label>
                        <Input 
                          placeholder="e.g., Software Engineer" 
                          value={formData.job_title}
                          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Employment Status</Label>
                      <select 
                        className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                        value={formData.employment_status}
                        onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                      >
                        <option value="current">Current Employee</option>
                        <option value="former">Former Employee</option>
                      </select>
                    </div>
                    
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label>Overall Rating *</Label>
                        <StarRating rating={formData.overall_rating} onChange={(r) => setFormData({ ...formData, overall_rating: r })} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Culture & Values</Label>
                        <StarRating rating={formData.culture_rating} onChange={(r) => setFormData({ ...formData, culture_rating: r })} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Senior Leadership</Label>
                        <StarRating rating={formData.leadership_rating} onChange={(r) => setFormData({ ...formData, leadership_rating: r })} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Compensation & Benefits</Label>
                        <StarRating rating={formData.compensation_rating} onChange={(r) => setFormData({ ...formData, compensation_rating: r })} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Work-Life Balance</Label>
                        <StarRating rating={formData.worklife_rating} onChange={(r) => setFormData({ ...formData, worklife_rating: r })} />
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Career Growth</Label>
                        <StarRating rating={formData.growth_rating} onChange={(r) => setFormData({ ...formData, growth_rating: r })} />
                      </div>
                    </div>

                    <div>
                      <Label>Pros</Label>
                      <Textarea 
                        placeholder="What do you like about working here?" 
                        value={formData.pros}
                        onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Cons</Label>
                      <Textarea 
                        placeholder="What could be improved?" 
                        value={formData.cons}
                        onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting || !formData.overall_rating}>
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <Card className="p-4 mb-6">
              <div className="flex gap-4">
                <Input 
                  placeholder="Search by company..." 
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && fetchReviews()}
                />
                <Button onClick={fetchReviews} className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </Card>

            {/* Stats */}
            {stats && stats.review_count > 0 && searchCompany && (
              <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <h3 className="font-semibold mb-4 text-lg">Company Stats: {searchCompany}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">{stats.avg_overall || "-"}</div>
                    <div className="text-sm text-muted-foreground">Overall Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.avg_culture || "-"}</div>
                    <div className="text-sm text-muted-foreground">Culture</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.avg_worklife || "-"}</div>
                    <div className="text-sm text-muted-foreground">Work-Life</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.review_count || 0}</div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                Loading reviews...
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">{review.company_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {review.job_title || "Employee"} • {review.employment_status === "current" ? "Current Employee" : "Former Employee"}
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRating rating={review.overall_rating} readonly />
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    {review.pros && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium mb-1">
                          <ThumbsUp className="h-3.5 w-3.5" /> Pros
                        </div>
                        <p className="text-sm bg-green-50 p-3 rounded-lg">{review.pros}</p>
                      </div>
                    )}
                    
                    {review.cons && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium mb-1">
                          <ThumbsDown className="h-3.5 w-3.5" /> Cons
                        </div>
                        <p className="text-sm bg-red-50 p-3 rounded-lg">{review.cons}</p>
                      </div>
                    )}

                    {/* Rating breakdown */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border text-xs">
                      {review.culture_rating > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">Culture: {review.culture_rating}/5</span>
                      )}
                      {review.leadership_rating > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">Leadership: {review.leadership_rating}/5</span>
                      )}
                      {review.compensation_rating > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">Comp: {review.compensation_rating}/5</span>
                      )}
                      {review.worklife_rating > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">Work-Life: {review.worklife_rating}/5</span>
                      )}
                      {review.growth_rating > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">Growth: {review.growth_rating}/5</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
                <p className="text-muted-foreground mb-6">Be the first to share your experience!</p>
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Write a Review
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
