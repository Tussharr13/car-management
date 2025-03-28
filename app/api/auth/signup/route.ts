import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      },
    })

    if (error) {
      console.error("Signup error:", error.message)
      
      // Handle rate limit errors from Supabase
      if (error.message.includes('rate limit') || error.status === 429) {
        return NextResponse.json(
          { error: "Too many signup attempts from Supabase. Please try again later." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user: data.user,
      message: "Account created successfully. Please check your email for verification."
    })
  } catch (error: any) {
    console.error("Signup error:", error.message || error)
    
    // Check if it's a rate limit error from Supabase
    if (error.message?.includes('rate limit') || error.status === 429) {
      return NextResponse.json(
        { error: "Too many signup attempts from Supabase. Please try again later." },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "An error occurred during signup" },
      { status: 500 }
    )
  }
} 