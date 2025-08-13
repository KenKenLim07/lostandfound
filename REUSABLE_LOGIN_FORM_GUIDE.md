# 🚀 Reusable Login Form Components

A complete, production-ready login form with floating labels, animations, and robust focus detection that you can use across all your apps!

## 📦 Components Included

1. **`ReusableLoginForm`** - Complete login/signup form
2. **`ReusableFloatingLabelInput`** - Individual floating label input
3. **`FloatingLabelInput`** - Original component (for reference)

## 🎯 Features

- ✅ **Floating Labels** with smooth animations
- ✅ **Robust Focus Detection** (solves React focus/blur timing issues)
- ✅ **Mobile-Optimized** (prevents iOS zoom, responsive design)
- ✅ **Supabase Integration** (with custom config support)
- ✅ **Form Validation** (email, password, confirm password)
- ✅ **Error Handling** (user-friendly error messages)
- ✅ **Success Feedback** (with auto-close options)
- ✅ **Mobile Menu Integration** (auto-close on success)
- ✅ **Customizable** (styling, text, behavior)
- ✅ **TypeScript** (fully typed)

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { ReusableLoginForm } from "@/components/auth/ReusableLoginForm"

export default function LoginPage() {
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
```

### 2. Dialog/Modal Usage

```tsx
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReusableLoginForm } from "@/components/auth/ReusableLoginForm"

export default function LoginDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <ReusableLoginForm 
          autoCloseOnSuccess={true}
          onSuccess={(user) => {
            // Handle successful login
            router.push("/dashboard")
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Mobile Menu Integration

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ReusableLoginForm } from "@/components/auth/ReusableLoginForm"

export default function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent>
        <ReusableLoginForm 
          isMobileMenu={true}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
          onSuccess={(user) => {
            // Menu will auto-close after 800ms
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
```

### 4. Custom Supabase Configuration

```tsx
<ReusableLoginForm 
  supabaseUrl="https://your-project.supabase.co"
  supabaseAnonKey="your-anon-key"
  onSuccess={(user) => console.log("Logged in:", user)}
/>
```

### 5. Custom Styling

```tsx
<ReusableLoginForm 
  className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl"
  buttonClassName="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
  inputClassName="border-2 border-gray-200 focus:border-blue-500"
  title="Welcome to MyApp"
  signInButtonText="Get Started"
  switchToSignUpText="New here? Create an account"
/>
```

### 6. Individual Floating Label Input

```tsx
import { ReusableFloatingLabelInput } from "@/components/ui/reusable-floating-label-input"
import { Search } from "lucide-react"

export default function SearchForm() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <ReusableFloatingLabelInput
      id="search"
      label="Search items..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      icon={<Search className="h-4 w-4" />}
      className="max-w-md"
    />
  )
}
```

## ⚙️ Configuration Options

### ReusableLoginForm Props

```typescript
interface ReusableLoginFormProps {
  // Supabase configuration
  supabaseUrl?: string
  supabaseAnonKey?: string
  
  // Form behavior
  initialMode?: "signin" | "signup"
  allowModeSwitch?: boolean
  autoCloseOnSuccess?: boolean
  redirectAfterSuccess?: string | null
  
  // Callbacks
  onSuccess?: (user: any) => void
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
```

### ReusableFloatingLabelInput Props

```typescript
interface ReusableFloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: boolean
  icon?: React.ReactNode
  
  // Customization options
  labelClassName?: string
  containerClassName?: string
  inputClassName?: string
  
  // Animation options
  animationDuration?: number
  
  // Focus detection method
  useIntervalFocusDetection?: boolean
  focusCheckInterval?: number
}
```

## 🔧 Troubleshooting

### Problem: Labels don't return to placeholder position

**Symptoms:**
- Labels stay floating even when field is empty and not focused
- Switching between inputs doesn't work properly
- Labels get "stuck" in floating position

**Root Cause:**
React's focus/blur event timing issues, especially in dialogs or when switching between inputs rapidly.

**Solutions:**

#### Solution 1: Use Interval Focus Detection (Recommended)
```tsx
<ReusableFloatingLabelInput
  useIntervalFocusDetection={true}
  focusCheckInterval={100}
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Solution 2: Increase Focus Check Interval
```tsx
<ReusableFloatingLabelInput
  focusCheckInterval={50} // More frequent checks
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Solution 3: Disable Interval Detection (Lighter but less reliable)
```tsx
<ReusableFloatingLabelInput
  useIntervalFocusDetection={false}
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Problem: Mobile input zoom on focus

**Symptoms:**
- iOS Safari zooms in when focusing on input fields
- Form becomes unusable on mobile

**Solution:**
The component already includes mobile optimization:
```css
/* Built into the component */
text-base md:text-sm /* 16px on mobile, 14px on desktop */
```

If you need custom sizing:
```tsx
<ReusableFloatingLabelInput
  inputClassName="text-lg md:text-base" // 18px on mobile, 16px on desktop
  label="Email"
/>
```

### Problem: Animation is choppy or not smooth

**Symptoms:**
- Label movement is jerky
- Transitions don't feel smooth

**Solutions:**

#### Solution 1: Adjust Animation Duration
```tsx
<ReusableFloatingLabelInput
  animationDuration={300} // Slower, smoother animation
  label="Email"
/>
```

#### Solution 2: Add CSS Transitions
```css
/* Add to your global CSS */
.floating-label {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Solution 3: Use Hardware Acceleration
```tsx
<ReusableFloatingLabelInput
  labelClassName="transform-gpu" // Enable hardware acceleration
  label="Email"
/>
```

### Problem: Form validation not working

**Symptoms:**
- No error messages appear
- Form submits with invalid data

**Solution:**
Make sure you're using the built-in validation:
```tsx
<ReusableLoginForm 
  onError={(error) => {
    // Handle validation errors
    console.error("Validation error:", error)
  }}
/>
```

### Problem: Success callback not firing

**Symptoms:**
- Login succeeds but callback doesn't run
- No redirect or state update after login

**Solution:**
Check your callback implementation:
```tsx
<ReusableLoginForm 
  onSuccess={(user) => {
    console.log("Success callback fired:", user)
    // Your logic here
    router.push("/dashboard")
  }}
  onError={(error) => {
    console.error("Error callback fired:", error)
  }}
/>
```

### Problem: Mobile menu not closing after login

**Symptoms:**
- Login succeeds but mobile menu stays open
- Poor UX on mobile

**Solution:**
Make sure you're passing the mobile menu props:
```tsx
<ReusableLoginForm 
  isMobileMenu={true}
  onMobileMenuClose={() => setMobileMenuOpen(false)}
  // Menu will auto-close after 800ms on success
/>
```

## 🎨 Customization Examples

### 1. Dark Theme
```tsx
<ReusableLoginForm 
  className="bg-gray-900 text-white"
  buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
  inputClassName="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
  title="Welcome to DarkApp"
/>
```

### 2. Gradient Background
```tsx
<ReusableLoginForm 
  className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 p-8 rounded-2xl shadow-xl"
  buttonClassName="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
  title="Welcome to GradientApp"
/>
```

### 3. Minimal Design
```tsx
<ReusableLoginForm 
  className="border border-gray-200 rounded-lg p-6"
  buttonClassName="bg-black hover:bg-gray-800 text-white"
  inputClassName="border-gray-300 focus:border-black"
  title="Minimal Login"
/>
```

### 4. Custom Icons
```tsx
import { Mail, Lock, User } from "lucide-react"

<ReusableFloatingLabelInput
  label="Email Address"
  icon={<Mail className="h-4 w-4" />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

## 📱 Mobile Optimization

The components are already optimized for mobile:

- **Prevents iOS zoom** with 16px+ font size
- **Responsive design** with Tailwind classes
- **Touch-friendly** button sizes
- **Auto-close** mobile menus on success
- **Proper keyboard** handling

## 🔒 Security Best Practices

1. **Always validate on server-side** - Client validation is for UX only
2. **Use HTTPS** in production
3. **Implement rate limiting** on your auth endpoints
4. **Add CSRF protection** if needed
5. **Use secure session management**

## 🚀 Performance Tips

1. **Use interval focus detection sparingly** - Only when needed
2. **Debounce form validation** for better performance
3. **Lazy load** the login form if not immediately needed
4. **Use React.memo** for custom components if re-rendering is expensive

## 📋 Migration Guide

### From Basic Input to Floating Label

**Before:**
```tsx
<input 
  type="email" 
  placeholder="Email Address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**After:**
```tsx
<ReusableFloatingLabelInput
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### From Custom Login Form to ReusableLoginForm

**Before:**
```tsx
// Your custom login form implementation
<form onSubmit={handleSubmit}>
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <button type="submit">Sign In</button>
</form>
```

**After:**
```tsx
<ReusableLoginForm 
  onSuccess={(user) => handleLoginSuccess(user)}
  onError={(error) => handleLoginError(error)}
/>
```

## 🎯 Advanced Usage

### 1. Custom Validation
```tsx
<ReusableLoginForm 
  onError={(error) => {
    if (error.includes("Invalid login credentials")) {
      // Custom handling for invalid credentials
      showCustomError("Please check your email and password")
    } else {
      // Handle other errors
      showError(error)
    }
  }}
/>
```

### 2. Multi-step Form Integration
```tsx
const [step, setStep] = useState(1)

{step === 1 && (
  <ReusableLoginForm 
    onSuccess={(user) => setStep(2)}
    title="Step 1: Sign In"
  />
)}

{step === 2 && (
  <ProfileSetupForm 
    user={user}
    onComplete={() => setStep(3)}
  />
)}
```

### 3. OAuth Integration
```tsx
<ReusableLoginForm 
  onSuccess={(user) => {
    // Handle OAuth user differently
    if (user.app_metadata?.provider) {
      handleOAuthUser(user)
    } else {
      handleEmailUser(user)
    }
  }}
/>
```

## 🐛 Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
// Add this to your component to see focus state changes
const [debugMode, setDebugMode] = useState(false)

useEffect(() => {
  if (debugMode) {
    console.log("Focus state changed:", isFocused)
  }
}, [isFocused, debugMode])
```

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Enable debug mode** to see what's happening
3. **Check browser console** for errors
4. **Verify Supabase configuration** is correct
5. **Test with minimal example** to isolate the issue

## 🎉 Success!

You now have a production-ready, reusable login form that you can use across all your apps! The floating labels will work reliably, the mobile experience will be smooth, and you'll have all the customization options you need.

Happy coding! 🚀 