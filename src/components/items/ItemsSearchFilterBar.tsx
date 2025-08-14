"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"



export type ItemsSearchFilterBarProps = {
  searchTerm: string
  onSearchTermChange: (next: string) => void
  filter: "all" | "lost" | "found" | "returned"
  onFilterChange: (next: "all" | "lost" | "found" | "returned") => void
  className?: string
}

export function ItemsSearchFilterBar({
  searchTerm,
  onSearchTermChange,
  filter,
  onFilterChange,
  className,
}: ItemsSearchFilterBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch gap-2 ${className ?? ""}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Search items by title or name..."
          className="pl-10 h-10"
          aria-label="Search items"
        />
      </div>
      <Select 
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as typeof filter)}
        className="w-full sm:w-[130px] h-10"
        aria-label="Filter items"
      >
        <option value="all">All Items</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
        <option value="returned">Returned</option>
      </Select>
    </div>
  )
} 