"use client"

import type { Company } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface CompanyCardProps {
  company: Company
  onVerify?: () => void
  isVerified?: boolean
}

export function CompanyCard({ company, onVerify, isVerified }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{company.name}</CardTitle>
            {company.domain && <CardDescription>{company.domain}</CardDescription>}
          </div>
          {company.verified && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Verified</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/companies/${company.id}`}>View Channel</Link>
          </Button>
          {!isVerified && onVerify && (
            <Button size="sm" onClick={onVerify}>
              Verify Employee
            </Button>
          )}
          {isVerified && <span className="text-xs text-green-600 flex items-center">✓ Verified</span>}
        </div>
      </CardContent>
    </Card>
  )
}
