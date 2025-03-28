"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Car {
  id: string
  title: string
  description: string
  tags: string[] | string | null
  car_images?: { id?: string; url: string }[]
  cover_image?: string
  images?: string[]
  created_at: string
}

export function CarCard({ car }: { car: Car }) {
  const [imageError, setImageError] = useState(false)
  
  // Get the cover image from various possible sources
  const getCoverImage = () => {
    if (imageError) return "https://via.placeholder.com/400x200?text=No+Image";
    
    // First check if there's a direct cover_image property
    if (car.cover_image) return car.cover_image;
    
    // Then check if there are images array
    if (car.images && car.images.length > 0) {
      return car.images[0];
    }
    
    // Then check if there are car_images
    if (car.car_images && car.car_images.length > 0) {
      return car.car_images[0].url;
    }
    
    // Finally, use a placeholder
    return "https://via.placeholder.com/400x200?text=No+Image";
  };
  
  const coverImage = getCoverImage();

  // Format the description to show only the first few words
  const shortDescription = car.description
    ? car.description.length > 100
      ? `${car.description.substring(0, 100)}...`
      : car.description
    : "No description available"

  // Convert tags to array regardless of how they're stored
  const tagsArray = (() => {
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
  })();

  return (
    <Card className="overflow-hidden">
      <Link href={`/cars/${car.id}`}>
        <div className="aspect-video relative overflow-hidden">
          <div className="w-full h-full relative">
            <Image
              src={coverImage}
              alt={car.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
              onError={() => setImageError(true)}
            />
          </div>
        </div>
      </Link>
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1">{car.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {shortDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground">
          Added on {new Date(car.created_at).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        {tagsArray.length > 0 &&
          tagsArray.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
      </CardFooter>
    </Card>
  )
}

