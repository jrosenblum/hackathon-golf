import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth/callback']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Create a Supabase client
    const supabase = createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    // If there's no session and the user is accessing a protected route, redirect to the login page
    if (!session && !publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin route protection
    if (pathname.startsWith('/admin') && !session?.user?.user_metadata?.isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // In case of any error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
