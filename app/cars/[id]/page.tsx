"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowLeft, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface Car {
  id: string
  title: string
  description: string
  tags: string[]
  car_images?: { id?: string; url: string }[]
  images?: string[]
  cover_image?: string
  created_at: string
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/cars/${params.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete car")
      }
      
      toast({
        title: "Car deleted",
        description: "Your car has been deleted successfully",
      })
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting car:", error)
      toast({
        title: "Error",
        description: "Failed to delete car",
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  // Get all available images from various sources
  const getAllImages = () => {
    if (!car) return [];
    
    // If car has images array, use that
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      return car.images;
    }
    
    // If car has car_images array, extract URLs
    if (car.car_images && car.car_images.length > 0) {
      return car.car_images.map(img => img.url);
    }
    
    // If car has cover_image, use that
    if (car.cover_image) {
      return [car.cover_image];
    }
    
    // No images
    return [];
  };

  // Convert tags to array regardless of how they're stored
  const getTagsArray = () => {
    if (!car) return [];
    
    if (!car.tags) return [];
    
    if (Array.isArray(car.tags)) return car.tags;
    
    if (typeof car.tags === 'string') {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(car.tags);
        return Array.isArray(parsed) ? parsed : [car.tags];
      } catch (e) {
        // If parsing fails, treat as a single tag
        return [car.tags];
      }
    }
    
    return [];
  };

  const images = getAllImages();
  const tagsArray = getTagsArray();
  
  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };
  
  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-24 bg-gray-200 rounded mb-6"></div>
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
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/cars/${car.id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your car and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {images.length > 0 ? (
          <div className="relative aspect-video mb-6 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={images[currentImageIndex]}
              alt={car.title}
              fill
              className="object-contain"
              priority
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                  aria-label="Next image"
                >
                  <ArrowLeft className="h-6 w-6 transform rotate-180" />
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-video mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{car.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tagsArray.length > 0 ? (
            tagsArray.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground">No tags</p>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mb-6">
          Added on {new Date(car.created_at).toLocaleDateString()}
        </div>
        
        <div className="prose max-w-none dark:prose-invert">
          {car.description ? (
            <p>{car.description}</p>
          ) : (
            <p className="text-muted-foreground">No description provided</p>
          )}
        </div>
      </div>
    </div>
  )
}

