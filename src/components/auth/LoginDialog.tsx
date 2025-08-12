"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginDialog() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  
  // Form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Validation state
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false
  })

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    return password === confirmPassword && password.length > 0
  }

  // Get validation states
  const isEmailValid = email === "" || validateEmail(email)
  const isPasswordValid = password === "" || validatePassword(password)
  const isConfirmPasswordValid = confirmPassword === "" || validateConfirmPassword(password, confirmPassword)

  // Check if form is valid
  const isFormValid = () => {
    if (mode === "signin") {
      return validateEmail(email) && validatePassword(password)
    } else {
      return validateEmail(email) && validatePassword(password) && 
             validateConfirmPassword(password, confirmPassword)
    }
  }

  // Handle field blur
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  // Reset form
  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
    setTouched({
      email: false,
      password: false,
      confirmPassword: false
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  // Handle mode switch
  const handleModeSwitch = () => {
    // Reset all form state when switching modes
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
    setTouched({
      email: false,
      password: false,
      confirmPassword: false
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
    setMode(mode === "signin" ? "signup" : "signin")
  }

  // Handle form submission
  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isFormValid()) {
      // Mark all fields as touched to show validation errors
      setTouched({
        email: true,
        password: true,
        confirmPassword: true
      })
      return
    }

    startTransition(async () => {
      try {
        if (mode === "signin") {
          const { error } = await supabase.auth.signInWithPassword({ 
            email: email.trim(), 
            password 
          })
          
          if (error) throw error
          
          setSuccess("Successfully logged in!")
          setTimeout(() => {
            setOpen(false)
            resetForm()
            router.refresh()
          }, 1000)
        } else {
          const { data, error } = await supabase.auth.signUp({ 
            email: email.trim(), 
            password
          })
          
          if (error) throw error
          
          if (data.session) {
            setSuccess("Account created and logged in!")
            setTimeout(() => {
              setOpen(false)
              resetForm()
              router.refresh()
            }, 1000)
          } else {
            setSuccess("Account created! Please check your email to confirm.")
            setTimeout(() => {
              setOpen(false)
              resetForm()
            }, 2000)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-9 px-4">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md w-[calc(100vw-2rem)] max-w-none mx-4" 
        autoFocus={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold text-center">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {mode === "signin" 
              ? "Enter your credentials to access your account" 
              : "Fill in your details to create a new account"
            }
          </p>
        </DialogHeader>
        
        <form onSubmit={handleAuth} className="space-y-6 pt-2">
          {/* Email field */}
          <div className="space-y-1">
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              error={!isEmailValid && touched.email}
              required
              autoComplete="email"
            />
            {!isEmailValid && touched.email && (
              <p className="text-xs text-destructive ml-3">Please enter a valid email address</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="relative">
              <FloatingLabelInput
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                error={!isPasswordValid && touched.password}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isPasswordValid && touched.password && (
              <p className="text-xs text-destructive ml-3">Password must be at least 6 characters</p>
            )}
          </div>

          {/* Confirm Password field (signup only) */}
          {mode === "signup" && (
            <div className="space-y-1">
              <div className="relative">
                <FloatingLabelInput
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  error={!isConfirmPasswordValid && touched.confirmPassword}
                  required
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isConfirmPasswordValid && touched.confirmPassword && (
                <p className="text-xs text-destructive ml-3">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/20">
              <p className="text-sm text-green-600 text-center">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || !isFormValid()}
            className="w-full h-12 font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "signin" ? "Sign In" : "Create Account"
            )}
          </Button>

          {/* Mode Switch */}
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleModeSwitch}
              className="text-sm text-muted-foreground hover:text-foreground"
              disabled={isPending}
            >
              {mode === "signin" 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 