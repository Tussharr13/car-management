import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { CarCard } from "@/components/car-card"
import { SearchForm } from "@/components/search-form"
import { SignOutButton } from "@/components/sign-out-button"

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = createServerClient()
  
  // Get authenticated user data using getUser for security
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect("/login")
  }

  const userId = user.id
  // Safely access search parameter
  const searchQuery = searchParams?.search || ""

  console.log('Fetching cars for user:', userId);

  // Fetch cars
  let carsQuery = supabase
    .from("cars")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (searchQuery) {
    carsQuery = carsQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
  }

  const { data: cars, error: carsError } = await carsQuery

  if (carsError) {
    console.error("Error fetching cars:", carsError)
  } else {
    console.log(`Found ${cars?.length || 0} cars for user ${userId}`);
  }

  // Process cars to ensure they have car_images property
  const carsWithImages = cars ? cars.map(car => {
    // If car has images array, convert to car_images format
    if (car.images && Array.isArray(car.images)) {
      console.log(`Car ${car.id} has ${car.images.length} images in images array`);
      return {
        ...car,
        car_images: car.images.map((url: string) => ({ url }))
      };
    }
    
    // If car has cover_image but no images array
    if (car.cover_image && (!car.images || !Array.isArray(car.images))) {
      console.log(`Car ${car.id} has cover_image: ${car.cover_image}`);
      return {
        ...car,
        images: [car.cover_image],
        car_images: [{ url: car.cover_image }]
      };
    }
    
    // No images
    console.log(`Car ${car.id} has no images`);
    return {
      ...car,
      car_images: []
    };
  }) : [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className="font-bold text-xl">
            CarManager
          </Link>
          <div className="flex items-center gap-4">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Cars</h1>
            <p className="text-muted-foreground">Manage your car collection</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <SearchForm defaultValue={searchQuery} />
            <Link href="/cars/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Car
              </Button>
            </Link>
          </div>
        </div>

        {carsWithImages && carsWithImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {carsWithImages.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No cars found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "No cars match your search criteria." : "You haven't added any cars yet."}
            </p>
            {!searchQuery && (
              <Link href="/cars/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Car
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

