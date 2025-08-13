"use client"

import { useState } from "react"
import { ItemsTable } from "./ItemsTable"
import UsersPanel from "./UsersPanel"
import { AdminReturnsList } from "./AdminReturnsList"
import { AdminOverview, useOverviewData } from "./AdminOverview"

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("overview")
  const { data: overviewData, isLoading: overviewLoading } = useOverviewData()

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "items", label: "Items" },
    { id: "returns", label: "Returns" },
    { id: "users", label: "Users" },
  ]

  return (
    <div className="space-y-6">
      {/* Sticky KPIs - Always visible */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <KpiCard 
            label="Total Items" 
            value={overviewLoading ? "—" : (overviewData?.totalCount ?? "—")} 
          />
          <KpiCard 
            label="Active" 
            value={overviewLoading ? "—" : (overviewData?.activeCount ?? "—")} 
          />
          <KpiCard 
            label="Active Lost" 
            value={overviewLoading ? "—" : (overviewData?.activeLostCount ?? "—")} 
          />
          <KpiCard 
            label="Active Found" 
            value={overviewLoading ? "—" : (overviewData?.activeFoundCount ?? "—")} 
          />
        </div>
        
        {/* Sticky Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Section */}
      <div className="pt-2">
        {activeSection === "overview" && <AdminOverview />}
        {activeSection === "items" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Items</h2>
            <ItemsTable pageSize={50} />
          </section>
        )}
        {activeSection === "returns" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Returns</h2>
            <AdminReturnsList />
          </section>
        )}
        {activeSection === "users" && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <UsersPanel />
          </section>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
} 