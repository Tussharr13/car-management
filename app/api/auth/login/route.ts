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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      
      // Handle rate limit errors from Supabase
      if (error.message.includes('rate limit') || error.status === 429) {
        return NextResponse.json(
          { error: "Too many login attempts from Supabase. Please try again later." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user: data.user
    })
  } catch (error: any) {
    console.error("Login error:", error.message || error)
    
    // Check if it's a rate limit error from Supabase
    if (error.message?.includes('rate limit') || error.status === 429) {
      return NextResponse.json(
        { error: "Too many login attempts from Supabase. Please try again later." },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "An error occurred during login" },
      { status: 500 }
    )
  }
} 