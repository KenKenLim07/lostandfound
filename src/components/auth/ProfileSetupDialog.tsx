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
}

export function ProfileSetupDialog({ open, onComplete, onCancel }: ProfileSetupDialogProps) {
  const supabase = useSupabase()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    school_id: '',
    year_section: '',
    contact_number: '',
    email: ''
  })
  
  const [touched, setTouched] = useState({
    full_name: false,
    school_id: false,
    year_section: false,
    contact_number: false,
    email: false
  })

  // Validation functions
  const validateSchoolId = (schoolId: string) => {
    // School ID format: YYYY-XXXXX (e.g., 2021-12345)
    const schoolIdRegex = /^\d{4}-\d{5}$/
    return schoolIdRegex.test(schoolId)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Philippine phone number format
    const phoneRegex = /^(\+63|0)9\d{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Get validation states
  const isFullNameValid = formData.full_name.trim().length >= 2
  const isSchoolIdValid = formData.school_id === '' || validateSchoolId(formData.school_id)
  const isYearSectionValid = formData.year_section.trim().length >= 3
  const isContactNumberValid = formData.contact_number === '' || validatePhone(formData.contact_number)
  const isEmailValid = formData.email === '' || validateEmail(formData.email)

  // Check if form is valid
  const isFormValid = () => {
    return isFullNameValid && 
           isSchoolIdValid && 
           isYearSectionValid && 
           isContactNumberValid && 
           isEmailValid &&
           formData.full_name.trim() !== '' &&
           formData.school_id.trim() !== '' &&
           formData.year_section.trim() !== '' &&
           formData.contact_number.trim() !== ''
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
            full_name: formData.full_name.trim(),
            school_id: formData.school_id.trim(),
            year_section: formData.year_section.trim(),
            contact_number: formData.contact_number.trim(),
            email: formData.email.trim() || null,
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
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear error when user starts typing
  }

  return (
    <Dialog open={open} onOpenChange={() => onCancel?.()}>
      <DialogContent className="max-w-md w-full mx-auto p-4">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              onBlur={() => handleBlur('full_name')}
              required
              placeholder="Enter your full name"
              className="h-12"
            />
          </div>

          {/* School ID */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="School ID"
              value={formData.school_id}
              onChange={(e) => handleInputChange('school_id', e.target.value)}
              onBlur={() => handleBlur('school_id')}
              required
              placeholder="YYYY-XXXXX (e.g., 2021-12345)"
              className="h-12"
            />
          </div>

          {/* Year & Section */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Year & Section"
              value={formData.year_section}
              onChange={(e) => handleInputChange('year_section', e.target.value)}
              onBlur={() => handleBlur('year_section')}
              required
              placeholder="e.g., 3rd Year - BSIT A"
              className="h-12"
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Contact Number"
              value={formData.contact_number}
              onChange={(e) => handleInputChange('contact_number', e.target.value)}
              onBlur={() => handleBlur('contact_number')}
              required
              type="tel"
              placeholder="+63 912 345 6789"
              className="h-12"
            />
          </div>

          {/* Email (Optional) */}
          <div className="space-y-1">
            <FloatingLabelInput
              label="Email (Optional)"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              type="email"
              placeholder="your.email@example.com"
              className="h-12"
            />
          </div>

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
        </form>
      </DialogContent>
    </Dialog>
  )
} 