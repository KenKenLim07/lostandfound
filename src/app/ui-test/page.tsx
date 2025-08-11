import { Button } from "@/components/ui/button"

export default function UiTestPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center gap-8 p-8">
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">UI Sanity Check</h1>
        <p className="text-muted-foreground">If styles look good and the button is styled, Tailwind and shadcn/ui are working.</p>
      </section>

      <section className="flex items-center gap-4">
        <Button>Default Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </section>

      <section className="w-full max-w-md rounded-lg bg-primary p-4 text-primary-foreground">
        <p>Primary themed block — text should be readable against background.</p>
      </section>

      <section className="grid w-full max-w-md grid-cols-2 gap-4">
        <div className="rounded-md border p-4">Bordered box</div>
        <div className="rounded-md border p-4">Bordered box</div>
      </section>
    </main>
  )
} 