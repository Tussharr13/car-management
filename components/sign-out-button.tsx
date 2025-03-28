"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase-browser"

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleSignOut = async () => {
    setLoading(true)
    
    try {
      // First, call our API to handle server-side signout and cookie deletion
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include', // Important for cookie operations
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to sign out")
      }
      
      // Also clear client-side session
      await supabase.auth.signOut()
      
      // Clear all auth-related items from storage
      const keysToRemove = []
      
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      
      // Remove the collected keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear session storage too
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
          sessionStorage.removeItem(key)
        }
      }
      
      // Clear cookies manually from client side as well
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=")
        if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        }
      })
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      
      // Force a hard navigation to clear any client state
      window.location.href = '/login'
    } catch (error: any) {
      console.error("Sign out error:", error)
      
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      })
      
      // Even if there's an error, try to redirect to login
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  )
} 