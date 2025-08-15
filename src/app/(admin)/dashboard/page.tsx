"use client"

import ItemsTable from "./ItemsTable"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Items Management</h1>
        <p className="text-muted-foreground">Manage all lost and found items.</p>
      </div>
      <ItemsTable />
    </div>
  )
} 