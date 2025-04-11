import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRedirectUrl } from '@/lib/utils'
import { isAllowedEmailDomain } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth/callback']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Create a Supabase client
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    // If there's no session and the user is accessing a protected route, redirect to the login page
    if (!session && !publicRoutes.some(route => pathname.startsWith(route))) {
      // Use our utility to ensure the redirect uses the proper origin
      // Pass the entire request object to access headers
      const loginUrl = createRedirectUrl('/login', request)
      console.log('Redirecting to login:', loginUrl.toString())
      return NextResponse.redirect(loginUrl)
    }
    
    // If user is authenticated, verify their email domain is allowed
    if (session?.user?.email) {
      const userEmail = session.user.email
      if (!isAllowedEmailDomain(userEmail)) {
        console.log(`Unauthorized email domain detected in middleware: ${userEmail.split('@')[1]}`)
        
        // Sign the user out
        await supabase.auth.signOut()
        
        // Redirect to login with error message
        const unauthorizedUrl = createRedirectUrl('/login?error=unauthorized_domain', request)
        return NextResponse.redirect(unauthorizedUrl)
      }
    }

    // Admin route protection
    if (pathname.startsWith('/admin') && !session?.user?.user_metadata?.isAdmin) {
      // Use our utility to ensure the redirect uses the proper origin
      // Pass the entire request object to access headers
      const dashboardUrl = createRedirectUrl('/dashboard', request)
      console.log('Redirecting to dashboard (not admin):', dashboardUrl.toString())
      return NextResponse.redirect(dashboardUrl)
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of any error, redirect to login
    // Use our utility with a fallback to absolute URL
    try {
      const loginUrl = createRedirectUrl('/login', request)
      return NextResponse.redirect(loginUrl)
    } catch (redirectError) {
      // Ultimate fallback
      return NextResponse.redirect('https://app.hackathon.golf/login')
    }
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
