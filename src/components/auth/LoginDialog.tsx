"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginDialog() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
          return
        }
        setSuccess("Logged in")
        setOpen(false)
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setError(error.message)
          return
        }
        if (data.session) {
          setSuccess("Account created. Logged in.")
          setOpen(false)
          router.refresh()
        } else {
          setSuccess("Account created. Please check your email to confirm.")
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Log in" : "Create account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAuth} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
          {success && <p className="text-green-600 text-sm" role="status">{success}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? (mode === "signin" ? "Logging in..." : "Signing up...") : (mode === "signin" ? "Log in" : "Sign up")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Create an account" : "Have an account? Log in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 