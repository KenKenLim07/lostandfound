import UsersPanel from "../UsersPanel"

export const dynamic = "force-dynamic"

export default function AdminUsersPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Users</h2>
      <UsersPanel />
    </div>
  )
} 