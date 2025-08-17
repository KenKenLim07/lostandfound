"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { ArrowLeft, User, GraduationCap, Phone, Hash, Save, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"


interface Profile {
  id: string
  full_name: string | null
  school_id: string | null
  year_section: string | null
  contact_number: string | null
  profile_complete: boolean | null
  created_at: string | null
  updated_at: string | null
  role?: string | null
  blocked?: boolean | null
}

export default function ProfilePage() {
  const supabase = useSupabase()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    school_id: '',
    year_section: '',
    contact_number: ''
  })

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace("/")
          return
        }

        // Get user email from session
        setUserEmail(session.user.email || "")

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) throw error

        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          school_id: profileData.school_id || '',
          year_section: profileData.year_section || '',
          contact_number: profileData.contact_number || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  // Validation functions
  const validateSchoolId = (schoolId: string) => {
    // School ID format: GSC-YY-XXXX or YYYY-Y-XXXX (e.g., GSC-15-0830, 2022-1-0078)
    const schoolIdRegex = /^(GSC-\d{2}-\d{4}|\d{4}-\d{1,2}-\d{4})$/
    return schoolIdRegex.test(schoolId)
  }

  const validatePhone = (phone: string) => {
    // Philippine phone number format: +639XXXXXXXXX (13 characters total including +)
    // This allows for 9 digits after +639, making it 13 characters total
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
    // If the input already has +63 prefix, return it as is to prevent duplication
    if (phone.startsWith('+63')) {
      return phone
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If it's already in +63 format (without +), add + prefix
    if (digits.startsWith('63') && digits.length === 12) {
      return `+${digits}`
    }
    
    // If it starts with 0, replace with +63
    if (digits.length === 12) {
      return `+63${digits.slice(1)}`
    }
    
    // If it's 10 digits (without country code), add +63
    if (digits.length === 10) {
      return `+63${digits}`
    }
    
    // Default: return as is (will be validated)
    return phone
  }

  const handlePhoneFocus = () => {
    // Only add +63 prefix if the field is completely empty
    if (!formData.contact_number || formData.contact_number.trim() === '') {
      setFormData(prev => ({ ...prev, contact_number: '+63' }))
    }
  }

  // Get validation states
  const isFullNameValid = formData.full_name.trim().length >= 2
  const isSchoolIdValid = formData.school_id === '' || validateSchoolId(formData.school_id)
  const isYearSectionValid = formData.year_section.trim().length >= 3
  const isContactNumberValid = formData.contact_number === '' || validatePhone(formData.contact_number)

  // Check if form is valid
  const isFormValid = () => {
    return isFullNameValid && 
           isSchoolIdValid && 
           isYearSectionValid && 
           isContactNumberValid && 
           formData.full_name.trim() !== '' &&
           formData.school_id.trim() !== '' &&
           formData.year_section.trim() !== '' &&
           formData.contact_number.trim() !== ''
  }

  // Handle form submission
  const handleSave = async () => {
    if (!isFormValid() || !profile) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: capitalizeName(formData.full_name.trim()),
          school_id: formData.school_id.trim(),
          year_section: capitalizeCourseYearSection(formData.year_section.trim()),
          contact_number: formData.contact_number.trim(),
          profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: capitalizeName(formData.full_name.trim()),
        school_id: formData.school_id.trim(),
        year_section: capitalizeCourseYearSection(formData.year_section.trim()),
        contact_number: formData.contact_number.trim(),
        profile_complete: true,
        updated_at: new Date().toISOString()
      } : null)

      setSuccess("Profile updated successfully!")
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
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
    setSuccess(null)
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-destructive">Failed to load profile</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-3 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="p-2 h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">My Profile</h1>
                <p className="text-muted-foreground text-sm">View and edit your profile information</p>
              </div>
            </div>
          </header>

          {/* Account Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium text-primary">{userEmail || 'Not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                // Edit Form
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <FloatingLabelInput
                      label="Full Name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
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
                      required
                      placeholder="GSC-15-0830 or 2022-1-0078"
                      className="h-12"
                    />
                  </div>

                  {/* Course Year & Section */}
                  <div className="space-y-1">
                    <FloatingLabelInput
                      label="Course Year & Section"
                      value={formData.year_section}
                      onChange={(e) => handleInputChange('year_section', e.target.value)}
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
                      required
                      type="tel"
                      placeholder="+639123456789"
                      className="h-12"
                      onFocus={handlePhoneFocus}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={!isFormValid() || isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        setError(null)
                        setSuccess(null)
                        // Reset form data to current profile
                        setFormData({
                          full_name: profile.full_name || '',
                          school_id: profile.school_id || '',
                          year_section: profile.year_section || '',
                          contact_number: profile.contact_number || ''
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{profile.full_name || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">School ID</p>
                        <p className="font-medium">{profile.school_id || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Course Year & Section</p>
                        <p className="font-medium">{profile.year_section || "Not set"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Number</p>
                        <p className="font-medium">{profile.contact_number || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Profile created: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                      {profile.updated_at && profile.updated_at !== profile.created_at && (
                        <span> • Last updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="text-sm text-green-600 bg-green-500/10 p-3 rounded-md">
                  {success}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
  )
} 