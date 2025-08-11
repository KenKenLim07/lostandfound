import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database, Tables } from "@/types/database"
import { ItemCard } from "@/components/items/ItemCard"

export const revalidate = 60

export default async function PublicHomePage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data, error } = await supabase
    .from("items")
    .select("id, title, name, type, description, date, location, contact_number, image_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(24)

  if (error) {
    return (
      <main className="mx-auto max-w-7xl p-0.5">
        <h1 className="text-2xl font-bold">Latest Items</h1>
        <p className="mt-2 text-destructive">Failed to load items: {error.message}</p>
      </main>
    )
  }

  const items = (data ?? []) as Array<
    Pick<Tables<"items">, "id" | "title" | "name" | "type" | "description" | "date" | "location" | "contact_number" | "image_url" | "status" | "created_at">
  >

  return (
    <main className="mx-auto max-w-7xl p-0.5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Latest Items</h1>
        <p className="text-muted-foreground">Browse recently posted lost and found items.</p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No items yet.</p>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 sm:gap-1">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              name={item.name}
              type={item.type as "lost" | "found"}
              description={item.description}
              date={item.date}
              location={item.location}
              contactNumber={item.contact_number}
              imageUrl={item.image_url}
              status={item.status as "active" | "returned" | null}
              createdAt={item.created_at}
              href={`/items/${item.id}`}
            />
          ))}
        </section>
      )}
    </main>
  )
} 