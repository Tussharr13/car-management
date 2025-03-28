import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the car without trying to join with car_images
    const { data: car, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching car:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (car.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Process car to ensure it has car_images property and tags is an array
    let processedCar = car;
    
    // Ensure tags is an array
    let tagsArray = [];
    if (car.tags) {
      if (Array.isArray(car.tags)) {
        tagsArray = car.tags;
      } else if (typeof car.tags === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(car.tags);
          tagsArray = Array.isArray(parsed) ? parsed : [car.tags];
        } catch (e) {
          // If parsing fails, treat as a single tag
          tagsArray = [car.tags];
        }
      }
    }
    
    // If car has images array, convert to car_images format
    if (car.images && Array.isArray(car.images)) {
      processedCar = {
        ...car,
        tags: tagsArray,
        car_images: car.images.map((url: string) => ({ url }))
      };
    }
    // If car has cover_image but no images array
    else if (car.cover_image && (!car.images || !Array.isArray(car.images))) {
      processedCar = {
        ...car,
        tags: tagsArray,
        images: [car.cover_image],
        car_images: [{ url: car.cover_image }]
      };
    }
    // No images
    else {
      processedCar = {
        ...car,
        tags: tagsArray,
        car_images: []
      };
    }

    return NextResponse.json(processedCar)
  } catch (error: any) {
    console.error("Error in GET /api/cars/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if car exists and belongs to user
    const { data: existingCar, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("id", params.id)
      .single()

    if (carError) {
      console.error("Error fetching car for update:", carError)
      return NextResponse.json({ error: carError.message }, { status: 404 })
    }

    if (existingCar.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const tagsString = formData.get("tags") as string
    const tags = tagsString
      ? tagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []

    // Update car data
    const { data: updatedCar, error: updateError } = await supabase
      .from("cars")
      .update({
        title,
        description,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating car:", updateError)
      throw updateError
    }

    // Handle image deletions
    const imagesToDelete = formData.get("imagesToDelete") as string
    let currentImages = existingCar.images || [];
    
    if (imagesToDelete && currentImages.length > 0) {
      const imageUrlsToDelete = imagesToDelete.split(",");
      
      // Filter out deleted images from the images array
      currentImages = currentImages.filter((url: string) => !imageUrlsToDelete.includes(url));
      
      // Delete files from storage
      for (const imageUrl of imageUrlsToDelete) {
        try {
          // Extract the path from the URL
          const urlParts = imageUrl.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${params.id}/${fileName}`;
          
          console.log(`Deleting image from storage: ${filePath}`);
          await supabase.storage.from("car-images").remove([filePath]);
        } catch (error) {
          console.error("Error deleting image from storage:", error);
        }
      }
    }

    // Add new images
    const imageFiles = []
    for (let i = 0; i < 10; i++) {
      const image = formData.get(`image${i}`) as File
      if (image && image instanceof File && image.size > 0) {
        imageFiles.push(image)
      }
    }

    const newImageUrls: string[] = [];
    
    if (imageFiles.length > 0) {
      const imageUploadPromises = imageFiles.map(async (file, index) => {
        try {
          const fileExt = file.name.split(".").pop()
          const fileName = `${params.id}/${Date.now()}-${index}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("car-images")
            .upload(fileName, file)

          if (uploadError) {
            console.error("Image upload error:", uploadError)
            return null
          }

          const { data: { publicUrl } } = supabase.storage
            .from("car-images")
            .getPublicUrl(fileName)

          newImageUrls.push(publicUrl);
          return publicUrl;
        } catch (error) {
          console.error("Error uploading image:", error)
          return null
        }
      })

      await Promise.all(imageUploadPromises)
    }

    // Combine existing and new images
    const allImages = [...currentImages, ...newImageUrls];
    
    // Update the car with the new images array and cover_image
    if (allImages.length > 0) {
      const { error: imageUpdateError } = await supabase
        .from("cars")
        .update({
          images: allImages,
          cover_image: allImages[0] // First image is the cover
        })
        .eq("id", params.id)
      
      if (imageUpdateError) {
        console.error("Error updating car images:", imageUpdateError)
      }
    }

    // Return the updated car with images
    return NextResponse.json({
      ...updatedCar,
      images: allImages,
      cover_image: allImages.length > 0 ? allImages[0] : null,
      car_images: allImages.map((url: string) => ({ url }))
    })
  } catch (error: any) {
    console.error("Error in PUT /api/cars/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if car exists and belongs to user
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("id", params.id)
      .single()

    if (carError) {
      console.error("Error fetching car for deletion:", carError)
      return NextResponse.json({ error: carError.message }, { status: 404 })
    }

    if (car.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete car images from storage
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      try {
        // List all files in the car's folder
        const { data: files } = await supabase.storage
          .from("car-images")
          .list(params.id)
        
        if (files && files.length > 0) {
          const filePaths = files.map(file => `${params.id}/${file.name}`);
          await supabase.storage.from("car-images").remove(filePaths);
        }
      } catch (error) {
        console.error("Error deleting car images from storage:", error);
      }
    }

    // Delete car from database
    const { error: deleteError } = await supabase
      .from("cars")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      console.error("Error deleting car:", deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/cars/[id]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

