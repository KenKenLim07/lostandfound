"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { ArrowLeft, User, GraduationCap, Phone, Mail, Hash, Save, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"


type Profile = {
  id: string
  full_name: string | null
  school_id: string | null
  year_section: string | null
  contact_number: string | null
  email: string | null
  profile_complete: boolean | null
  created_at: string | null
  updated_at: string | null
}

export default function ProfilePage() {
  const supabase = useSupabase()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
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
    contact_number: '',
    email: ''
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
          contact_number: profileData.contact_number || '',
          email: profileData.email || ''
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
    const schoolIdRegex = /^\d{4}-\d{5}$/
    return schoolIdRegex.test(schoolId)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
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
          full_name: formData.full_name.trim(),
          school_id: formData.school_id.trim(),
          year_section: formData.year_section.trim(),
          contact_number: formData.contact_number.trim(),
          email: formData.email.trim() || null,
          profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name.trim(),
        school_id: formData.school_id.trim(),
        year_section: formData.year_section.trim(),
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim() || null,
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
    setFormData(prev => ({ ...prev, [field]: value }))
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
                      type="email"
                      placeholder="your.email@example.com"
                      className="h-12"
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
                          contact_number: profile.contact_number || '',
                          email: profile.email || ''
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
                        <p className="text-sm text-muted-foreground">Year & Section</p>
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

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile.email || "Not provided"}</p>
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