"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ReusableLoginForm } from "@/components/auth/ReusableLoginForm"
import { ReusableFloatingLabelInput } from "@/components/ui/reusable-floating-label-input"
import { Search, Mail, Lock } from "lucide-react"

// Example 1: Basic Login Form
export function BasicLoginExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <ReusableLoginForm 
        title="Welcome Back"
        onSuccess={(user) => console.log("Logged in:", user)}
        onError={(error) => console.error("Login error:", error)}
      />
    </div>
  )
}

// Example 2: Dialog/Modal Login
export function DialogLoginExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <ReusableLoginForm 
          autoCloseOnSuccess={true}
          onSuccess={(user) => {
            console.log("Logged in:", user)
            // Handle successful login
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

// Example 3: Mobile Menu Login
export function MobileMenuLoginExample() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button>Open Menu</Button>
      </SheetTrigger>
      <SheetContent>
        <ReusableLoginForm 
          isMobileMenu={true}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
          onSuccess={(user) => {
            console.log("Logged in:", user)
            // Menu will auto-close after 800ms
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

// Example 4: Custom Styled Login
export function CustomStyledLoginExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <ReusableLoginForm 
        className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl shadow-lg"
        buttonClassName="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        inputClassName="border-2 border-gray-200 focus:border-blue-500"
        title="Welcome to MyApp"
        signInButtonText="Get Started"
        switchToSignUpText="New here? Create an account"
        onSuccess={(user) => console.log("Logged in:", user)}
      />
    </div>
  )
}

// Example 5: Individual Floating Label Inputs
export function FloatingLabelInputsExample() {
  const [searchTerm, setSearchTerm] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Floating Label Inputs</h2>
      
      <ReusableFloatingLabelInput
        id="search"
        label="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="h-4 w-4" />}
      />
      
      <ReusableFloatingLabelInput
        id="email"
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail className="h-4 w-4" />}
      />
      
      <ReusableFloatingLabelInput
        id="password"
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock className="h-4 w-4" />}
      />
    </div>
  )
}

// Example 6: Dark Theme Login
export function DarkThemeLoginExample() {
  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg">
      <ReusableLoginForm 
        className="bg-gray-900 text-white"
        buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
        inputClassName="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        title="Welcome to DarkApp"
        onSuccess={(user) => console.log("Logged in:", user)}
      />
    </div>
  )
}

// Example 7: Minimal Login
export function MinimalLoginExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <ReusableLoginForm 
        className="border border-gray-200 rounded-lg p-6"
        buttonClassName="bg-black hover:bg-gray-800 text-white"
        inputClassName="border-gray-300 focus:border-black"
        title="Minimal Login"
        onSuccess={(user) => console.log("Logged in:", user)}
      />
    </div>
  )
}

// Example 8: Custom Animation Duration
export function CustomAnimationExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <ReusableFloatingLabelInput
        id="slow-animation"
        label="Slow Animation (500ms)"
        animationDuration={500}
        className="mb-4"
      />
      
      <ReusableFloatingLabelInput
        id="fast-animation"
        label="Fast Animation (100ms)"
        animationDuration={100}
      />
    </div>
  )
}

// Example 9: Focus Detection Options
export function FocusDetectionExample() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Focus Detection Methods</h2>
      
      <ReusableFloatingLabelInput
        id="interval-detection"
        label="Interval Detection (Recommended)"
        useIntervalFocusDetection={true}
        focusCheckInterval={100}
        className="mb-4"
      />
      
      <ReusableFloatingLabelInput
        id="event-detection"
        label="Event Detection (Lighter)"
        useIntervalFocusDetection={false}
      />
    </div>
  )
}

// Example 10: All Examples Page
export function AllLoginExamples() {
  return (
    <div className="container mx-auto p-6 space-y-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        Reusable Login Form Examples
      </h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">1. Basic Login Form</h2>
        <BasicLoginExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">2. Dialog/Modal Login</h2>
        <div className="text-center">
          <DialogLoginExample />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">3. Mobile Menu Login</h2>
        <div className="text-center">
          <MobileMenuLoginExample />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">4. Custom Styled Login</h2>
        <CustomStyledLoginExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">5. Individual Floating Label Inputs</h2>
        <FloatingLabelInputsExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">6. Dark Theme Login</h2>
        <DarkThemeLoginExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">7. Minimal Login</h2>
        <MinimalLoginExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">8. Custom Animation Duration</h2>
        <CustomAnimationExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">9. Focus Detection Options</h2>
        <FocusDetectionExample />
      </section>
    </div>
  )
} 