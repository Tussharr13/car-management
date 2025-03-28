import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  
  // Create a Supabase client
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh the session if it exists
  const { data: { session } } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const { pathname } = req.nextUrl

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/cars']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Define auth routes (login, signup) that should redirect to dashboard if already logged in
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // Handle root path
  if (pathname === '/') {
    // If logged in, redirect to dashboard
    if (session) {
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    // If not logged in, redirect to login
    else {
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect logic for protected routes
  if (isProtectedRoute && !session) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logic for auth routes
  if (isAuthRoute && session) {
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Return the response with the refreshed session
  return res
}

// Define which paths should be processed by the middleware
export const config = {
  matcher: [
    // Match all routes except for static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|api/|images/).*)',
  ],
}
