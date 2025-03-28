"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, Loader2 } from "lucide-react"

interface Car {
  id: string
  title: string
  description: string
  tags: string[]
  car_images?: { id?: string; url: string }[]
  images?: string[]
  cover_image?: string
}

export default function EditCarPage({ params }: { params: { id: string } }) {
  const [car, setCar] = useState<Car | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/cars/${params.id}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch car")
        }
        
        const data = await response.json()
        setCar(data)
        setTitle(data.title || "")
        setDescription(data.description || "")
        setTags(data.tags ? data.tags.join(", ") : "")
        
        // Get all images from various sources
        let allImages: string[] = [];
        
        if (data.images && Array.isArray(data.images)) {
          allImages = data.images;
        } else if (data.car_images && data.car_images.length > 0) {
          allImages = data.car_images.map((img: any) => img.url);
        } else if (data.cover_image) {
          allImages = [data.cover_image];
        }
        
        setImages(allImages);
      } catch (error) {
        console.error("Error fetching car:", error)
        toast({
          title: "Error",
          description: "Failed to load car details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchCar()
  }, [params.id, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("tags", tags)
      
      // Add images to delete
      if (imagesToDelete.length > 0) {
        formData.append("imagesToDelete", imagesToDelete.join(","))
      }
      
      // Add new images
      newImages.forEach((image, index) => {
        formData.append(`image${index}`, image)
      })
      
      const response = await fetch(`/api/cars/${params.id}`, {
        method: "PUT",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to update car")
      }
      
      toast({
        title: "Car updated",
        description: "Your car has been updated successfully",
      })
      
      router.push(`/cars/${params.id}`)
    } catch (error) {
      console.error("Error updating car:", error)
      toast({
        title: "Error",
        description: "Failed to update car",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (fileList) {
      const filesArray = Array.from(fileList)
      setNewImages(prev => [...prev, ...filesArray].slice(0, 10 - images.length))
    }
  }

  const removeImage = (index: number) => {
    const imageUrl = images[index]
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagesToDelete(prev => [...prev, imageUrl])
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Car not found</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Car</h1>
          <Link href={`/cars/${params.id}`}>
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
            <Label>Current Images</Label>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={url}
                      alt={`Car image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No images available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newImages">Add Images</Label>
            <Input
              id="newImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="cursor-pointer"
              disabled={images.length + newImages.length >= 10}
            />
            <p className="text-sm text-muted-foreground">
              Upload up to {10 - images.length} more images. First image will be the cover.
            </p>
            
            {newImages.length > 0 && (
              <div className="mt-4">
                <Label>New Images to Upload</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`New image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

