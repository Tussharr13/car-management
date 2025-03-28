"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { X, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CarFormProps {
  car?: any
}

export function CarForm({ car }: CarFormProps) {
  const [title, setTitle] = useState(car?.title || "")
  const [description, setDescription] = useState(car?.description || "")
  const [tags, setTags] = useState(car?.tags?.join(", ") || "")
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>(car?.car_images || [])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const totalImages = existingImages.length - imagesToDelete.length + images.length + newFiles.length

      if (totalImages > 10) {
        toast({
          title: "Too many images",
          description: "You can only upload up to 10 images per car.",
          variant: "destructive",
        })
        return
      }

      setImages([...images, ...newFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = (id: string) => {
    setImagesToDelete([...imagesToDelete, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your car.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("tags", tags)

      if (car) {
        // Update existing car
        if (imagesToDelete.length > 0) {
          formData.append("imagesToDelete", imagesToDelete.join(","))
        }

        images.forEach((file, index) => {
          formData.append(`image${index}`, file)
        })

        const response = await fetch(`/api/cars/${car.id}`, {
          method: "PUT",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update car")
        }

        toast({
          title: "Car updated",
          description: "Your car has been updated successfully.",
        })

        router.push(`/cars/${car.id}`)
      } else {
        // Create new car
        images.forEach((file, index) => {
          formData.append(`image${index}`, file)
        })

        const response = await fetch("/api/cars", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create car")
        }

        const { car } = await response.json()

        toast({
          title: "Car created",
          description: "Your car has been created successfully.",
        })

        router.push(`/cars/${car.id}`)
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter car title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter car description"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. sedan, toyota, dealer"
        />
        <p className="text-sm text-muted-foreground">Separate tags with commas (e.g. car_type, company, dealer)</p>
      </div>

      <div className="space-y-2">
        <Label>Images (up to 10)</Label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
          {/* Existing images */}
          {existingImages.map(
            (image) =>
              !imagesToDelete.includes(image.id) && (
                <Card key={image.id} className="relative overflow-hidden aspect-square">
                  <Image src={image.url || "/placeholder.svg"} alt="Car image" fill className="object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeExistingImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ),
          )}

          {/* New images */}
          {images.map((file, index) => (
            <Card key={index} className="relative overflow-hidden aspect-square">
              <Image
                src={URL.createObjectURL(file) || "/placeholder.svg"}
                alt="Car image"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}

          {/* Add image button */}
          {existingImages.length - imagesToDelete.length + images.length < 10 && (
            <Card
              className="flex items-center justify-center aspect-square cursor-pointer border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center p-4">
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">Click to upload</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                multiple
              />
            </Card>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {10 - (existingImages.length - imagesToDelete.length + images.length)} image slots remaining
        </p>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {car ? "Update Car" : "Create Car"}
        </Button>
      </div>
    </form>
  )
}

