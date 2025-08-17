"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/hooks/useSupabase"
import type { Database, TablesInsert } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { compressImage, formatFileSize } from "@/lib/image-utils"
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { postItem } from "./actions"
import { CustomTopLoader } from "@/components/system/CustomTopLoader"
import { ProfileGuard } from "@/components/auth/ProfileGuard"
import { Loader2 } from "lucide-react"

// Custom CSS for perfect circle button
const circleButtonStyles = `
  .perfect-circle-btn {
    width: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    min-width: 28px !important;
    min-height: 28px !important;
    max-width: 28px !important;
    max-height: 28px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
`

export default function PostItemPage() {
  const supabase = useSupabase()
  const router = useRouter()

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // Form state - removed redundant fields
  const [type, setType] = useState<"lost" | "found">("lost")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")

  // Image state
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number
    compressedSize: number
    compressionRatio: number
  } | null>(null)

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    async function checkUserStatus() {
      try {
        setIsCheckingStatus(true)
        const { data } = await supabase.auth.getSession()
        
      if (!isMounted) return
        
        if (!data.session) {
        router.replace("/")
        return
      }

        const userId = data.session.user.id
        setUserId(userId)

        // Check if user is blocked
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("blocked")
          .eq("id", userId)
          .single()

        if (!isMounted) return

        if (profileError) {
          console.error("Error checking user status:", profileError)
          setError("Failed to verify your account status. Please try again.")
          return
        }

        if (profile?.blocked) {
          setIsBlocked(true)
          setError("Your account has been blocked. You cannot post new items. Please contact an administrator if you believe this is an error.")
        }

      setIsLoadingUser(false)
      } catch (error) {
        if (!isMounted) return
        console.error("Error checking user status:", error)
        setError("Failed to verify your account. Please try again.")
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false)
        }
      }
    }

    checkUserStatus()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  // Handle file selection and compression
  async function handleFileSelect(file: File) {
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setError(null)

    // Create preview
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)

    // Compress image
    setIsCompressing(true)
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
      })

      setCompressedFile(compressed.file)
      setCompressionInfo({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio
      })
    } catch {
      setError('Failed to compress image. Please try again.')
      setImagePreview(null)
    } finally {
      setIsCompressing(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!userId) return
    
    // Check if user is blocked before allowing submission
    if (isBlocked) {
      setError("Your account has been blocked. You cannot post new items.")
      return
    }

    startTransition(async () => {
      try {
        setIsUploading(true)
        setUploadProgress(0)

        // 1) Upload image if provided
        let image_url: string | null = null
        const bucket = "items"
        
        if (compressedFile) {
          const fileExt = compressedFile.name.split(".").pop()
          const fileName = `${crypto.randomUUID()}.${fileExt}`
          
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
          }, 100)

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, compressedFile, { upsert: false })

          clearInterval(progressInterval)
          
          if (uploadError) throw uploadError
          
          setUploadProgress(100)
          const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName)
          image_url = publicUrl.publicUrl
        }

        // 2) Use server action for posting (includes blocked user check)
        const formData = new FormData()
        formData.append("type", type)
        formData.append("title", title || "")
        formData.append("description", description || "")
        formData.append("date", date || new Date().toISOString().slice(0, 10))
        formData.append("location", location || "")
        if (image_url) {
          formData.append("image_url", image_url)
        }

        await postItem(formData)

        setSuccess("Item posted successfully!")
        setTimeout(() => router.push("/"), 1500)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    })
  }

  function removeImage() {
    setCompressedFile(null)
    setImagePreview(null)
    setCompressionInfo(null)
    setError(null)
  }

  if (isLoadingUser || isCheckingStatus) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-4">
        {/* Custom Top Loader for loading states */}
        <CustomTopLoader 
          isLoading={true} 
          color="#000000"
          height={3}
          duration={300}
        />
        
        <div className="max-w-xl mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </main>
    )
  }

  if (isBlocked) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-4">
        {/* Custom Top Loader for blocked state */}
        <CustomTopLoader 
          isLoading={false} 
          color="#000000"
          height={3}
          duration={300}
        />
        
        <div className="max-w-xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-destructive">Account Blocked</h1>
            <p className="text-muted-foreground">
              Your account has been blocked. You cannot post new items at this time.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact an administrator.
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ProfileGuard>
      <main className="container mx-auto px-3 sm:px-6 py-4">
        {/* Custom CSS for perfect circle */}
        <style dangerouslySetInnerHTML={{ __html: circleButtonStyles }} />
        
        {/* Custom Top Loader for internal loading states */}
        <CustomTopLoader 
          isLoading={isCheckingStatus || isUploading || isCompressing || isPending} 
          color="#000000"
          height={3}
          duration={300}
        />
        
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <header className="mb-4">
            <h1 className="text-xl font-bold mb-1">Post Lost/Found Item</h1>
            <p className="text-muted-foreground text-sm">Help someone find their lost item or return a found item to its owner.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "lost" ? "default" : "outline"}
                  onClick={() => setType("lost")}
                  className="h-10 text-sm"
                >
                  Lost Item
                </Button>
                <Button
                  type="button"
                  variant={type === "found" ? "default" : "outline"}
                  onClick={() => setType("found")}
                  className="h-10 text-sm"
                >
                  Found Item
                </Button>
              </div>
            </div>

            {/* Item Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Item Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., iPhone 17 Pro Max 1TB Fully Paid."
                required
                className="h-10 text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item in detail (color, brand, identifying marks, etc.)"
                className="min-h-[80px] text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-sm font-medium">Date Lost/Found *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-10 text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was the item lost/found?"
                className="h-10 text-base sm:text-sm"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Image (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                {!imagePreview ? (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="cursor-pointer"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center border-0 shadow-sm perfect-circle-btn"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {compressionInfo && (
                      <div className="flex-1 space-y-1 text-xs text-muted-foreground">
                        <p>Original: {formatFileSize(compressionInfo.originalSize)}</p>
                        <p>Compressed: {formatFileSize(compressionInfo.compressedSize)}</p>
                        <p>Reduced by: {compressionInfo.compressionRatio.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || isUploading || isCompressing}
              className="w-full h-10"
            >
              {isPending || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Posting..."}
                </>
              ) : (
                "Post Item"
              )}
            </Button>
          </form>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      </main>
    </ProfileGuard>
  )
} 