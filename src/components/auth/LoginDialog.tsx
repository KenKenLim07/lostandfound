"use client"

import { useState, useTransition } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { Eye, EyeOff, Loader2, User } from "lucide-react"
import { ProfileSetupDialog } from "@/components/auth/ProfileSetupDialog"

export type LoginDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  initialMode?: "signin" | "signup"
  note?: string
  isMobileMenu?: boolean
  onMobileMenuClose?: () => void
}

export function LoginDialog(props: LoginDialogProps = {}) {
  const { open: controlledOpen, onOpenChange, showTrigger = true, initialMode = "signin", note, isMobileMenu = false, onMobileMenuClose } = props
  const supabase = useSupabase()
  const [open, setOpen] = useState(controlledOpen ?? false)
  const effectiveOpen = controlledOpen !== undefined ? controlledOpen : open
  const setEffectiveOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    if (controlledOpen === undefined) setOpen(next)
    
    // Clear forgot password message when dialog closes
    if (!next) {
      setForgotPasswordMessage(null)
    }
  }
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  
  // Multi-step signup state
  const [signupStep, setSignupStep] = useState<"account" | "profile" | "complete">("account")
  
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
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0)
  const [isForgotPasswordPending, setIsForgotPasswordPending] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null)
  
  // Profile setup state
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [signupCompleted, setSignupCompleted] = useState(false)

  // Validation state
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false
  })



  // Rate limiting protection - prevent attempts within 2 seconds
  const canAttemptAuth = () => {
    const now = Date.now()
    return now - lastAttemptTime > 2000
  }

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
      // Simple validation for signup
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
    setSignupStep("account")
    setError(null)
    setSuccess(null)
    setForgotPasswordMessage(null)
    setShowProfileSetup(false)
    setSignupCompleted(false)
    setTouched({
      email: false,
      password: false,
      confirmPassword: false
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      setError("Please enter a valid email address first")
      return
    }

    setIsForgotPasswordPending(true)
    setError(null)
    setForgotPasswordMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`
      })

      if (error) {
        throw error
      }

      setForgotPasswordMessage("Password reset email sent! Please check your inbox.")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email"
      setError(errorMessage)
    } finally {
      setIsForgotPasswordPending(false)
    }
  }

  // Handle mode switch
  const handleModeSwitch = () => {
    setMode(prev => (prev === "signin" ? "signup" : "signin"))
    setSignupStep("account") // Reset to first step when switching to signup
    setError(null)
    setSuccess(null)
    setForgotPasswordMessage(null)
    setSignupCompleted(false)
  }

  // Handle auth
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple rapid submissions
    if (isPending) return
    
    // Prevent re-submission if signup is already completed
    if (mode === "signup" && signupCompleted) {
      setError("Signup already completed. Please close this dialog.")
      return
    }
    
    // Rate limiting protection
    if (!canAttemptAuth()) {
      setError("Please wait a moment before trying again.")
      return
    }
    
    setError(null)
    setSuccess(null)
    setLastAttemptTime(Date.now())

    if (!isFormValid()) {
      setTouched({ email: true, password: true, confirmPassword: mode === "signup" })
      return
    }

    startTransition(async () => {
      try {
        if (mode === "signin") {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          
          // Show success immediately
          setSuccess("Signed in successfully!")
          
          // Close mobile menu if provided
          if (isMobileMenu && onMobileMenuClose) {
            setTimeout(() => {
              onMobileMenuClose()
            }, 800)
          } else {
            // Reset form and close dialog after showing success
          setTimeout(() => {
              resetForm()
            setEffectiveOpen(false)
            }, 800)
          }
        } else {
          // Mobile menu: Simple signup, Dialog: Multi-step signup
          if (isMobileMenu) {
            // Simple signup for mobile menu
          const { error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          
          setSuccess("Account created! Please check your email to confirm.")
          
            // Close mobile menu after showing success
            if (onMobileMenuClose) {
            setTimeout(() => {
              onMobileMenuClose()
              }, 1500)
            }
          } else {
            // Multi-step signup flow for dialog
            if (signupStep === "account") {
              // Step 1: Create account
              const { error } = await supabase.auth.signUp({ email, password })
              if (error) throw error
              
              // Show profile setup dialog
              setShowProfileSetup(true)
              setSuccess("Account created! Now let's set up your profile.")
              setError(null)
              return
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred"
        
        // Handle rate limiting specifically
        if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
          setError("Too many login attempts. Please wait 15-30 minutes before trying again.")
        } else if (errorMessage.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials.")
        } else {
          setError(errorMessage)
        }
      }
    })
  }

  // If this is for mobile menu, render as a simple form instead of dialog
  if (isMobileMenu) {
    return (
      <div className="space-y-4" key={`mobile-${mode}-${success ? 'success' : 'form'}`}>
        
        <form onSubmit={handleAuth} className="space-y-4 mobile-menu">
        
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h3>
          {note && (
            <p className="text-xs text-foreground mt-1">{note}</p>
          )}
        </div>
        
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
              className="h-12"
              labelBgClassName="bg-white"
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
                className="h-12"
                labelBgClassName="bg-white"
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
                  className="h-12"
                  labelBgClassName="bg-white"
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

          {/* Forgot Password Success Message */}
          {forgotPasswordMessage && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700 text-center break-words whitespace-normal">
                {forgotPasswordMessage}
              </p>
            </div>
          )}

          {/* Forgot Password (signin only) */}
          {mode === "signin" && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isForgotPasswordPending || !email || !validateEmail(email)}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {isForgotPasswordPending ? "Sending..." : "Forgot your password?"}
              </button>
            </div>
          )}

          {/* Mode Switch */}
          <div className="text-center">
            <p className="text-sm">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="font-medium underline underline-offset-4" onClick={handleModeSwitch}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </form>
      </div>
    )
  }

  return (
    <Dialog open={effectiveOpen} onOpenChange={setEffectiveOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="h-9 px-4">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent 
        className="sm:max-w-md rounded-2xl border bg-white dark:bg-white backdrop-blur-none shadow-2xl ring-1 ring-border/50 p-6 sm:p-7" 
        autoFocus={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Show header and step indicator only when not completed */}
        {!signupCompleted ? (
          <>
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-semibold tracking-tight text-center">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </DialogTitle>
          <p className="text-sm md:text-base text-muted-foreground text-center mt-1">
            {mode === "signin" 
              ? "Enter your credentials to access your account" 
              : "Fill in your details to create a new account"
            }
          </p>
          {note && (
            <p className="text-xs md:text-sm text-center text-foreground/80 mt-2">{note}</p>
          )}
        </DialogHeader>
        
        {/* Step Indicator (signup only) */}
        {mode === "signup" && (
          <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground mb-2">
            <div className={`flex items-center ${signupStep === "account" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shadow-xs ${
                signupStep === "account" ? "border-primary/40 bg-primary text-white" : "border-border/80 bg-muted text-foreground"
              }`}>
                ✓
              </div>
              <span className="ml-2">Account</span>
            </div>
            <div className="w-10 h-px bg-border"></div>
            <div className={`flex items-center ${signupStep === "profile" ? "text-primary" : ""}`}>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shadow-xs ${
                signupStep === "profile" ? "border-primary/40 bg-primary text-white" : "border-border/80"
              }`}>
                2
              </div>
              <span className="ml-2">Profile</span>
            </div>
          </div>
        )}
          </>
        ) : (
          /* Show completion header when signup is completed */
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-center text-green-600">
              Congratulations, You Made It!
            </DialogTitle>
            <p className="text-sm md:text-base text-muted-foreground text-center mt-1">
              &ldquo;Proud Of You!&rdquo;
            </p>
          </DialogHeader>
        )}
        
        {/* Show form or completion message */}
        {!signupCompleted && (
        <form onSubmit={handleAuth} className="space-y-6 pt-2">
          {/* Account Fields (Step 1 only) */}
          {signupStep === "account" && (
            <>
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
                  className="h-12"
              labelBgClassName="bg-white"
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
                    autoComplete="new-password"
                    className="h-12"
                labelBgClassName="bg-white"
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

              {/* Confirm Password field */}
              {mode === "signup" && signupStep === "account" && (
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
                      className="h-12"
                  labelBgClassName="bg-white"
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
            </>
          )}

          {/* Profile Setup Dialog */}
          {showProfileSetup && (
            <ProfileSetupDialog
              open={showProfileSetup}
              email={email}
              onComplete={() => {
                setShowProfileSetup(false)
                setSignupCompleted(true)
                setSuccess("Profile completed! Welcome to the platform!")
                // Close dialog after showing success
                setTimeout(() => {
                  setEffectiveOpen(false)
                }, 1500)
              }}
              onCancel={() => {
                setShowProfileSetup(false)
                setError("Profile setup cancelled. You can complete it later.")
              }}
            />
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
                {isMobileMenu && signupStep === "complete" && (
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
            className="w-full h-12 font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in..." : 
                 signupStep === "account" ? "Creating account..." : "Saving profile..."}
              </>
            ) : (
              mode === "signin" ? "Sign In" : 
              signupStep === "account" ? "Create Account" : "Complete Profile"
            )}
          </Button>

          {/* Forgot Password Success Message */}
          {forgotPasswordMessage && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700 text-center break-words whitespace-normal">
                {forgotPasswordMessage}
              </p>
            </div>
          )}

          {/* Forgot Password (signin only) */}
          {mode === "signin" && (
          <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isForgotPasswordPending || !email || !validateEmail(email)}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {isForgotPasswordPending ? "Sending..." : "Forgot your password?"}
              </button>
            </div>
          )}

          {/* Mode Switch (only show during initial state) */}
          {mode === "signin" && (
            <div className="text-center">
              <p className="text-sm">
                Don&apos;t have an account?{" "}
              <button type="button" className="font-medium underline underline-offset-4" onClick={handleModeSwitch}>
                  Sign up
                </button>
              </p>
            </div>
          )}
          
          {mode === "signup" && signupStep === "account" && (
            <div className="text-center">
              <p className="text-sm">
                Already have an account?{" "}
                <button type="button" className="font-medium underline underline-offset-4" onClick={handleModeSwitch}>
                  Sign in
              </button>
            </p>
          </div>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 