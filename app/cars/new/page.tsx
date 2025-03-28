"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function NewCarPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Redirect to dashboard after successful car creation
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("tags", tags)

      // Add images to form data
      images.forEach((image, index) => {
        console.log(`Adding image ${index} to form data:`, image.name, image.type, image.size)
        formData.append(`image${index}`, image)
      })

      console.log("Submitting form data with images:", images.length)
      
      const response = await fetch("/api/cars", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create car")
      }

      // Log the entire response for debugging
      console.log("Car creation response:", data);

      toast({
        title: "Car created",
        description: "Your car has been created successfully.",
      })

      // Set success state to trigger redirect
      setSuccess(true)
    } catch (error: any) {
      console.error("Error creating car:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the car.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (fileList) {
      const filesArray = Array.from(fileList)
      console.log("Selected files:", filesArray.map(f => ({ name: f.name, type: f.type, size: f.size })))
      setImages(filesArray.slice(0, 10)) // Limit to 10 images
    }
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Car</h1>
        <Link href="/dashboard">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. sedan, electric, family"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="images">Images</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Upload up to 10 images. First image will be the cover.
          </p>
          {images.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">{images.length} image(s) selected</p>
              <ul className="text-xs text-muted-foreground mt-1">
                {images.slice(0, 3).map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
                {images.length > 3 && <li>...and {images.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || success}>
            {loading ? "Creating..." : success ? "Created! Redirecting..." : "Create Car"}
          </Button>
        </div>
      </form>
    </div>
  )
}

