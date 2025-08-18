"use client"

import { useState, useTransition } from "react"
import { useSupabase } from "@/hooks/useSupabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { Loader2, User, GraduationCap, Phone, Mail, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProfileSetupDialogProps = {
  open: boolean
  onComplete: () => void
  onCancel?: () => void
  email?: string // Add email prop for account summary
}

export function ProfileSetupDialog({ open, onComplete, onCancel, email }: ProfileSetupDialogProps) {
  const supabase = useSupabase()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    school_id: '',
    year_section: '',
    contact_number: ''
  })
  
  const [touched, setTouched] = useState({
    full_name: false,
    school_id: false,
    year_section: false,
    contact_number: false
  })

  // Validation functions
  const validateSchoolId = (schoolId: string) => {
    // School ID format: GSC-YY-XXXX or YYYY-Y-XXXX (e.g., GSC-15-0830, 2022-1-0078)
    const schoolIdRegex = /^(GSC-\d{2}-\d{4}|\d{4}-\d{1,2}-\d{4})$/
    return schoolIdRegex.test(schoolId)
  }

  const validatePhone = (phone: string) => {
    // Philippine phone number format: +639XXXXXXXXX
    const phoneRegex = /^\+639\d{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Auto-capitalization functions
  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const capitalizeCourseYearSection = (text: string) => {
    return text.toUpperCase()
  }

  // Phone number formatting functions
  const formatPhoneNumber = (phone: string) => {
    // If the input already starts with +63, return it as is to prevent duplication
    if (phone.startsWith('+63')) {
      return phone
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If it starts with 0, replace with +63
    if (digits.startsWith('0') && digits.length === 11) {
      return `+63${digits.slice(1)}`
    }
    
    // If it's 9 digits (without country code), add +63
    if (digits.length === 9) {
      return `+63${digits}`
    }
    
    // Default: return as is (will be validated)
    return phone
  }

  const handlePhoneFocus = () => {
    // If field is empty, add +63 prefix
    if (!formData.contact_number) {
      setFormData(prev => ({ ...prev, contact_number: '+63' }))
    }
  }

  // Get validation states
  const isFullNameValid = formData.full_name.trim().length >= 2
  const isSchoolIdValid = formData.school_id === '' || validateSchoolId(formData.school_id)
  const isYearSectionValid = formData.year_section === '' || formData.year_section.trim().length >= 3
  const isContactNumberValid = formData.contact_number === '' || validatePhone(formData.contact_number)

  // Check if form is valid
  const isFormValid = () => {
    return isFullNameValid && isContactNumberValid
  }

  // Handle field blur
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) return
    
    startTransition(async () => {
      try {
        setError(null)
        
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Not authenticated')
          return
        }

        // Update profile with new data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: capitalizeName(formData.full_name.trim()),
            school_id: formData.school_id.trim() || null,
            year_section: formData.year_section.trim() || null,
            contact_number: formData.contact_number.trim() || null,
            profile_complete: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)

        if (updateError) {
          console.error('Profile update error:', updateError)
          setError('Failed to save profile. Please try again.')
          return
        }

        // Success - call onComplete callback
        onComplete()
        
      } catch (err) {
        console.error('Profile setup error:', err)
        setError('An unexpected error occurred. Please try again.')
      }
    })
  }

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    let processedValue = value
    
    // Apply real-time formatting
    if (field === 'full_name') {
      processedValue = capitalizeName(value)
    } else if (field === 'year_section') {
      processedValue = capitalizeCourseYearSection(value)
    } else if (field === 'contact_number') {
      processedValue = formatPhoneNumber(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md w-full mx-auto p-4">
        {/* Progress Indicator - TOP */}
        <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center text-primary">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium border-primary bg-primary text-white">
              ✓
            </div>
            <span className="ml-2">Account</span>
          </div>
          <div className="w-10 h-px bg-muted-foreground"></div>
          <div className="flex items-center text-primary">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium border-primary bg-primary text-white">
              2
            </div>
            <span className="ml-2">Profile</span>
          </div>
        </div>
        
        <DialogHeader className="pb-3">
          <DialogTitle className="flex flex-col items-center gap-2 text-lg justify-center">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Almost done! Just a few more details... 
          </p>
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium">Full Name</span> and <span className="font-medium">Contact Number</span> are required. Other fields are optional.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Summary */}
          {email && (
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground text-center mb-2">Account Details</p>
              <p className="text-sm font-medium text-center">{email}</p>
            </div>
          )}
          
          {/* Full Name */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              onBlur={() => handleBlur('full_name')}
              required
              placeholder="Enter your full name"
              className={cn(
                "h-12",
                touched.full_name && !isFullNameValid ? "border-destructive" : ""
              )}
            />
            {touched.full_name && !isFullNameValid && (
              <p className="text-xs text-destructive">Please enter your full name (at least 2 characters)</p>
            )}
          </div>

          {/* School ID */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="School ID (Skip if faculty/staff)"
              value={formData.school_id}
              onChange={(e) => handleInputChange('school_id', e.target.value)}
              onBlur={() => handleBlur('school_id')}
              placeholder="Enter your school ID (e.g., GSC-15-0830)"
              className={cn(
                "h-12",
                touched.school_id && !isSchoolIdValid ? "border-destructive" : ""
              )}
            />
            {touched.school_id && !isSchoolIdValid && (
              <p className="text-xs text-muted-foreground">Skip if faculty/staff: Please enter a valid GSU school ID or leave blank</p>
            )}
          </div>

          {/* Course Year & Section */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Course Year & Section (Skip if faculty/staff)"
              value={formData.year_section}
              onChange={(e) => handleInputChange('year_section', e.target.value)}
              onBlur={() => handleBlur('year_section')}
              placeholder="e.g., 3rd Year - BSIT A"
              className={cn(
                "h-12",
                touched.year_section && !isYearSectionValid ? "border-destructive" : ""
              )}
            />
            {touched.year_section && !isYearSectionValid && (
              <p className="text-xs text-muted-foreground">Skip if faculty/staff: Please enter your course year and section or leave blank</p>
            )}
          </div>

          {/* Contact Number */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Contact Number"
              value={formData.contact_number}
              onChange={(e) => handleInputChange('contact_number', e.target.value)}
              onBlur={() => handleBlur('contact_number')}
              type="tel"
              required
              placeholder="+639123456789"
              className={cn(
                "h-12",
                touched.contact_number && !isContactNumberValid ? "border-destructive" : ""
              )}
              onFocus={handlePhoneFocus}
            />
            {touched.contact_number && !isContactNumberValid && (
              <p className="text-xs text-destructive">Please enter a valid phone number (+639XXXXXXXXX)</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gap-2" 
            disabled={!isFormValid() || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                Complete Profile
              </>
            )}
          </Button>

          {/* Skip for now */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onCancel?.()}
              className="text-xs text-muted-foreground hover:underline"
            >
              Skip for now
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 