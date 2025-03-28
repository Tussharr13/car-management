import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold">CarManager</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Manage Your Car Collection
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Create, view, edit, and delete your car listings with ease. Upload images, add details, and organize
                  with tags.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline">Create Account</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 items-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Manage Your Cars</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Add up to 10 images per car, with detailed descriptions and custom tags.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Search Functionality</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Easily find your cars with our powerful search across titles, descriptions, and tags.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Secure Access</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Your car collection is private and only accessible to you after authentication.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 CarManager. All rights reserved.</p>
      </footer>
    </div>
  )
}

