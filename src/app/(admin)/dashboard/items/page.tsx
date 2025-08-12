import { ItemsTable } from "../ItemsTable"

export const dynamic = "force-dynamic"

export default function AdminItemsPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Items</h2>
      <ItemsTable pageSize={50} />
    </div>
  )
} 