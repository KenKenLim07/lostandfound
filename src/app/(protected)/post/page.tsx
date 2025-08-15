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

export default function PostItemPage() {
  const supabase = useSupabase()
  const router = useRouter()

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [type, setType] = useState<"lost" | "found">("lost")
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [reporterYearSection, setReporterYearSection] = useState("")

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
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      const session = data.session
      if (!session) {
        router.replace("/")
        return
      }
      setUserId(session.user.id)
      setIsLoadingUser(false)
    })
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
        formData.append("name", name || "")
        formData.append("description", description || "")
        formData.append("date", date || new Date().toISOString().slice(0, 10))
        formData.append("location", location || "")
        formData.append("contactNumber", contactNumber || "")
        formData.append("reporterYearSection", reporterYearSection || "")
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

  if (isLoadingUser) {
    return (
      <main className="container mx-auto px-3 sm:px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="border-2 border-dashed rounded-lg p-6">
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-3 sm:px-6 py-4">
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

          {/* Your Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Item Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">Item Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Black Backpack, iPhone 15, etc."
              required
              className="h-10 text-sm"
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
              className="min-h-[80px] text-sm"
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
              className="h-10 text-sm"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was it lost/found?"
              className="h-10 text-sm"
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <Label htmlFor="contact" className="text-sm font-medium">Contact Number</Label>
            <Input
              id="contact"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Your phone number for contact"
              className="h-10 text-sm"
            />
          </div>

          {/* Course/Year/Section */}
          <div className="space-y-1.5">
            <Label htmlFor="reporter_year_section" className="text-sm font-medium">Course / Year & Section</Label>
            <Input
              id="reporter_year_section"
              value={reporterYearSection}
              onChange={(e) => setReporterYearSection(e.target.value)}
              placeholder="e.g., BSIT 3A, BSHM 2B"
              className="h-10 text-sm"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Photo (Optional)</Label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-1">Click to upload an image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                                  <Image
                  src={imagePreview}
                  alt="Preview"
                  width={400}
                  height={160}
                  className="w-full h-40 object-cover rounded-lg"
                  unoptimized
                />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {isCompressing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full bg-muted" aria-hidden />
                    Compressing image...
                  </div>
                )}

                {compressionInfo && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Original:</span>
                      <span>{formatFileSize(compressionInfo.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compressed:</span>
                      <span>{formatFileSize(compressionInfo.compressedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saved:</span>
                      <span className="text-green-600">{compressionInfo.compressionRatio.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} max={100} />
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-600/10 border border-green-600/20 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3">
            <Button
              type="submit"
              disabled={isPending || isCompressing || isUploading}
              className="w-full h-11 text-sm font-medium"
            >
              {isPending || isUploading ? (
                <>
                  <span className="mr-2" aria-hidden>…</span>
                  {isUploading ? "Uploading..." : "Posting..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Post Item
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
} 