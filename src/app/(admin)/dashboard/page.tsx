"use client"

import { useState } from "react"
import { ItemsTable } from "./ItemsTable"
import UsersPanel from "./UsersPanel"
import { AdminReturnsList } from "./AdminReturnsList"
import AdminOverview from "./AdminOverview"

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("overview")

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "items", label: "Items" },
    { id: "returns", label: "Returns" },
    { id: "users", label: "Users" },
  ]

  return (
    <div className="space-y-6">
      {/* Sticky Header with Title */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2">
        {/* Title Section */}
        <div className="mb-1">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* Sticky Navigation Tabs */}
        <div className="flex flex-wrap gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-colors border ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
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