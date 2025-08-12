"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/items", label: "Items" },
  { href: "/dashboard/returns", label: "Returns" },
  { href: "/dashboard/users", label: "Users" },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {links.map((l) => {
        const active = pathname === l.href
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              "rounded px-2 py-1.5 transition-colors " +
              (active ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground")
            }
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
} 