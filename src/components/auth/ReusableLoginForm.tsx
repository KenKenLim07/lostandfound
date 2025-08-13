"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { Eye, EyeOff } from "lucide-react"

export interface ReusableLoginFormProps {
  // Supabase configuration
  supabaseUrl?: string
  supabaseAnonKey?: string
  
  // Form behavior
  initialMode?: "signin" | "signup"
  allowModeSwitch?: boolean
  autoCloseOnSuccess?: boolean
  redirectAfterSuccess?: string | null
  
  // Callbacks
  onSuccess?: (user: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onError?: (error: string) => void
  onModeSwitch?: (mode: "signin" | "signup") => void
  
  // Styling
  className?: string
  buttonClassName?: string
  inputClassName?: string
  
  // Customization
  title?: string
  signInButtonText?: string
  signUpButtonText?: string
  switchToSignUpText?: string
  switchToSignInText?: string
  
  // Mobile menu integration
  isMobileMenu?: boolean
  onMobileMenuClose?: () => void
}

export function ReusableLoginForm({
  // Supabase config
  supabaseUrl,
  supabaseAnonKey,
  
  // Form behavior
  initialMode = "signin",
  allowModeSwitch = true,
  autoCloseOnSuccess = true,
  redirectAfterSuccess = null,
  
  // Callbacks
  onSuccess,
  onError,
  onModeSwitch,
  
  // Styling
  className = "",
  buttonClassName = "",
  inputClassName = "",
  
  // Customization
  title,
  signInButtonText = "Sign In",
  signUpButtonText = "Sign Up",
  switchToSignUpText = "Don't have an account? Sign up",
  switchToSignInText = "Already have an account? Sign in",
  
  // Mobile menu
  isMobileMenu = false,
  onMobileMenuClose,
}: ReusableLoginFormProps) {
  // Use provided Supabase config or fall back to environment variables
  const supabase = createClientComponentClient<Database>({
    supabaseUrl: supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  })

  // Form state
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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
    resetForm()
    const newMode = mode === "signin" ? "signup" : "signin"
    setMode(newMode)
    onModeSwitch?.(newMode)
  }

  // Handle auth
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isFormValid()) {
      setTouched({ email: true, password: true, confirmPassword: mode === "signup" })
      return
    }

    startTransition(async () => {
      try {
        if (mode === "signin") {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          
          // Show success immediately
          setSuccess("Signed in successfully!")
          
          // Call success callback
          onSuccess?.(data.user)
          
          // Handle mobile menu close
          if (isMobileMenu && onMobileMenuClose) {
            setTimeout(() => {
              onMobileMenuClose()
            }, 800)
          } else if (autoCloseOnSuccess) {
            // Reset form after showing success
            setTimeout(() => {
              resetForm()
            }, 800)
          }
          
          // Handle redirect
          if (redirectAfterSuccess) {
            setTimeout(() => {
              window.location.href = redirectAfterSuccess
            }, 1000)
          }
          
        } else {
          const { data, error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          
          setSuccess("Account created successfully! Please check your email to verify your account.")
          
          // Call success callback
          onSuccess?.(data.user)
          
          // Handle mobile menu close
          if (isMobileMenu && onMobileMenuClose) {
            setTimeout(() => {
              onMobileMenuClose()
            }, 1000)
          } else if (autoCloseOnSuccess) {
            // Reset form after showing success
            setTimeout(() => {
              resetForm()
            }, 1000)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred"
        setError(errorMessage)
        onError?.(errorMessage)
      }
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="text-center">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
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
            className={inputClassName}
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
              className={inputClassName}
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
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
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
                className={inputClassName}
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
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
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
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 text-center break-words whitespace-normal">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 text-center">
              {success}
              {isMobileMenu && (
                <span className="block text-xs text-green-600 mt-1">
                  Menu will close automatically...
                </span>
              )}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending || !isFormValid()}
          className={`w-full ${buttonClassName}`}
        >
          {isPending ? "Loading..." : mode === "signin" ? signInButtonText : signUpButtonText}
        </Button>

        {/* Mode Switch */}
        {allowModeSwitch && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signin" ? switchToSignUpText : switchToSignInText}
            </button>
          </div>
        )}
      </form>
    </div>
  )
} 