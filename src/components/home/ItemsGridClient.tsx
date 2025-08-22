"use client"

import { ItemCard } from "@/components/items/ItemCard"

export type GridItem = {
  id: string
  title: string | null
  type: "lost" | "found"
  description: string | null
  date: string
  location: string | null
  image_url: string | null
  status: "active" | "returned" | null
  created_at: string
}

export default function ItemsGridClient({ items }: { items: GridItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          id={item.id}
          title={item.title}
          name={"Unknown User"}
          type={item.type}
          description={item.description}
          date={item.date}
          location={item.location}
          contactNumber={null}
          imageUrl={item.image_url}
          status={item.status}
          createdAt={item.created_at}
          href={`/items/${item.id}?from=home`}
          priority={index < 3} // Prioritize first 3 items
        />
      ))}
    </div>
  )
} 