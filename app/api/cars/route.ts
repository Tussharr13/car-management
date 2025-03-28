import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    // Authenticate the user properly
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('Authenticated user:', { id: user.id, email: user.email })

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const tagsString = formData.get("tags") as string
    
    // Ensure tags are properly formatted as an array
    let tags: string[] = [];
    if (tagsString) {
      tags = tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // Log all form data keys for debugging
    console.log('Form data keys:', Array.from(formData.keys()))
    console.log('Tags after processing:', tags)
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    console.log('Attempting to create car with data:', { title, description, tags, user_id: user.id })

    // Validate data before insertion
    if (!user.id) {
      console.error('Missing user ID for car creation')
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Process images first
    const imageFiles = []
    for (let i = 0; i < 10; i++) {
      const image = formData.get(`image${i}`) as File | null
      if (image && image instanceof File && image.size > 0) {
        imageFiles.push(image)
      }
    }

    console.log(`Found ${imageFiles.length} image files to process`)
    
    // Check if the storage bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking storage buckets:', bucketsError);
      } else {
        const carImagesBucketExists = buckets.some(bucket => bucket.name === 'car-images');
        
        if (!carImagesBucketExists) {
          console.log('Creating car-images bucket');
          const { error: createBucketError } = await supabase.storage.createBucket('car-images', {
            public: true
          });
          
          if (createBucketError) {
            console.error('Error creating car-images bucket:', createBucketError);
          } else {
            console.log('car-images bucket created successfully');
          }
        } else {
          console.log('car-images bucket already exists');
        }
      }
    } catch (bucketError) {
      console.error('Exception checking/creating storage bucket:', bucketError);
    }

    // Create car record first
    const { data: car, error: carError } = await supabase
      .from("cars")
      .insert({
        title,
        description,
        tags: tags as string[],
        user_id: user.id,
      })
      .select()
      .single()

    if (carError) {
      console.error('Supabase car insert error:', JSON.stringify(carError, null, 2))
      return NextResponse.json({ 
        error: carError.message || "Failed to create car", 
        details: carError.details || "",
        hint: carError.hint || "",
        code: carError.code || ""
      }, { status: 500 })
    }

    if (!car) {
      console.error('Car record not returned after successful insert')
      return NextResponse.json({ error: "Failed to create car record" }, { status: 500 })
    }

    console.log('Car created successfully:', car)

    // Now upload images
    const imageUrls: string[] = []
    
    if (imageFiles.length > 0) {
      const imageUploadPromises = imageFiles.map(async (file, index) => {
        try {
          const fileExt = file.name.split(".").pop()
          const fileName = `${car.id}/${Date.now()}-${index}.${fileExt}`

          console.log(`Uploading image ${index + 1} with name: ${fileName}`)
          
          const { data: uploadData, error: uploadError } = await supabase.storage.from("car-images").upload(fileName, file)

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            return null
          }

          console.log(`Image ${index + 1} uploaded successfully, getting public URL`)
          
          const {
            data: { publicUrl },
          } = supabase.storage.from("car-images").getPublicUrl(fileName)

          console.log(`Public URL for image ${index + 1}: ${publicUrl}`)
          
          imageUrls.push(publicUrl)
          return publicUrl
        } catch (err) {
          console.error(`Error processing image ${index}:`, err)
          return null
        }
      })

      await Promise.all(imageUploadPromises)
      console.log(`All images processed. Total successful uploads: ${imageUrls.length}`)
    }

    // Update the car record with images
    if (imageUrls.length > 0) {
      try {
        // Update with cover image (first image)
        const { error: updateError } = await supabase
          .from("cars")
          .update({ 
            cover_image: imageUrls[0],
            images: imageUrls  // Store all image URLs in an array column
          })
          .eq("id", car.id)
        
        if (updateError) {
          console.error('Error updating car with images:', updateError)
        } else {
          console.log('Car updated with images:', imageUrls)
        }
      } catch (updateError) {
        console.error('Exception updating car with images:', updateError)
      }
    }

    // Return the updated car data
    return NextResponse.json({ 
      success: true, 
      car: {
        ...car,
        cover_image: imageUrls.length > 0 ? imageUrls[0] : null,
        images: imageUrls,
        car_images: imageUrls.map(url => ({ url }))
      }
    })
  } catch (error: any) {
    console.error("Error creating car:", error.message || error)
    console.error("Error details:", error instanceof Error ? error.stack : JSON.stringify(error, null, 2))
    
    return NextResponse.json({ 
      error: error.message || "Failed to create car",
      code: error.code,
      details: error.details,
      hint: error.hint
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient()

  try {
    // Authenticate the user properly
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    try {
      // Fetch cars
      let carsQuery = supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (search) {
        carsQuery = carsQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
      }

      const { data: cars, error: carsError } = await carsQuery

      if (carsError) {
        console.error('Error fetching cars:', carsError)
        return NextResponse.json({ error: carsError.message || "Failed to fetch cars" }, { status: 500 })
      }

      if (!cars || cars.length === 0) {
        return NextResponse.json([])
      }

      // Process cars to ensure they have car_images property
      const processedCars = cars.map(car => {
        // If car has images array, convert to car_images format
        if (car.images && Array.isArray(car.images)) {
          return {
            ...car,
            car_images: car.images.map((url: any) => ({ url }))
          };
        }
        
        // If car has cover_image but no images array
        if (car.cover_image && (!car.images || !Array.isArray(car.images))) {
          return {
            ...car,
            images: [car.cover_image],
            car_images: [{ url: car.cover_image }]
          };
        }
        
        // No images
        return {
          ...car,
          car_images: []
        };
      });

      return NextResponse.json(processedCars)
    } catch (error: any) {
      console.error("Error processing cars data:", error)
      return NextResponse.json({ error: error.message || "Failed to process cars data" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch cars" }, { status: 500 })
  }
} 