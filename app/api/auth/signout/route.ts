import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient()
  
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut()
    
    // Create a response object for redirect
    const response = NextResponse.json({ success: true })
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Clear all auth-related cookies
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || 
          cookie.name.includes('sb-') || 
          cookie.name.includes('auth') || 
          cookie.name === '__session') {
        
        console.log(`Deleting cookie: ${cookie.name}`)
        
        // Set cookie expiration to a past date to delete it
        response.cookies.set({
          name: cookie.name,
          value: '',
          expires: new Date(0),
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true
        })
      }
    }
    
    return response
  } catch (error) {
    console.error("Error during sign out:", error)
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 })
  }
}

