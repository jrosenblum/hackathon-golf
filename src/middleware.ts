import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createRedirectUrl } from '@/lib/utils'
import { isAllowedEmailDomain } from '@/lib/auth.domains'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('[DEBUG-MW] Middleware running for path:', pathname)
  
  // Log cookies in middleware
  console.log('[DEBUG-MW] Cookies in middleware:', Array.from(request.cookies.getAll()).map(c => c.name))
  
  // No special bypasses needed anymore - all routes should work properly now
  
  // Add more paths to public routes to avoid redirect loops
  const publicRoutes = [
    '/', 
    '/login', 
    '/auth/callback', 
    '/debug', 
    '/api/auth-check',
    '/_next',
    '/favicon.ico',
    '/api/auth'
  ]
  
  // Enhanced check for public routes
  const isPublicRoute = publicRoutes.some(route => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match for non-root routes
    if (route !== '/' && pathname.startsWith(route)) return true;
    return false;
  })
  
  if (isPublicRoute) {
    console.log('[DEBUG-MW] Public route, skipping auth check')
    return NextResponse.next()
  }

  try {
    console.log('[DEBUG-MW] Protected route, checking auth')
    
    // Create a new response to modify
    let response = NextResponse.next()
    
    // Bypass normal auth checks if:
    // 1. We're in the middle of an auth flow (auth_flow_started cookie exists)
    // 2. We have Supabase PKCE flow cookies
    // 3. We have the auth_session_validated cookie
    const authFlowStarted = request.cookies.get('auth_flow_started')
    const authSessionValidated = request.cookies.get('auth_session_validated')
    const hasPKCECookies = request.cookies.get('sb-wtclmehycsdgoetynaoi-auth-token-code-verifier') || 
                          request.cookies.get('sb-auth-token-code-verifier')
    
    // Check if we have an auth token cookie
    const hasAuthTokenCookie = request.cookies.get('sb-wtclmehycsdgoetynaoi-auth-token') ||
                              request.cookies.get('sb-auth-token')
    
    // Check for special cases that could indicate we're in the middle of an auth flow
    if (authFlowStarted || hasPKCECookies || authSessionValidated) {
      console.log('[DEBUG-MW] Auth flow indicators detected:',
        authFlowStarted ? 'flow started cookie' : '',
        hasPKCECookies ? 'PKCE cookies' : '',
        authSessionValidated ? 'session validated cookie' : ''
      )
      
      // If we're in the middle of auth flow or have validation cookies, 
      // let the request proceed to avoid interrupting the flow
      if ((authFlowStarted && !authSessionValidated) || hasPKCECookies) {
        console.log('[DEBUG-MW] Auth flow in progress, skipping auth check')
        
        // Allow the request to continue to avoid interrupting the flow
        const freshResponse = NextResponse.next()
        
        // Keep the auth_flow_started cookie alive
        if (authFlowStarted) {
          freshResponse.cookies.set({
            name: 'auth_flow_started',
            value: authFlowStarted.value,
            maxAge: 300, // 5 minutes
            path: '/',
            sameSite: 'lax'
          })
        }
        
        // If we have an auth token but not session validated, add it
        if (hasAuthTokenCookie && !authSessionValidated) {
          freshResponse.cookies.set({
            name: 'auth_session_validated',
            value: 'true',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        }
        
        return freshResponse
      }
    }
    
    // Create a Supabase client with proper middleware integration
    const supabase = createMiddlewareClient({ 
      req: request, 
      res: response 
    })

    // Check if user is authenticated using getUser
    console.log('[DEBUG-MW] Calling getUser()')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[DEBUG-MW] User auth result:',
      user ? `User authenticated: ${user.id}` : 'No user found',
      userError ? `Error: ${userError.message}` : 'No error'
    )

    // If there's no authenticated user and the user is accessing a protected route, redirect to the login page
    if ((!user || userError) && !publicRoutes.some(route => pathname.startsWith(route))) {
      // Use our utility to ensure the redirect uses the proper origin
      // Pass the entire request object to access headers
      const loginUrl = createRedirectUrl('/login', request)
      console.log('[DEBUG-MW] Redirecting to login:', loginUrl.toString())
      
      // Create a new redirect response
      response = NextResponse.redirect(loginUrl)
      
      // Add a debug cookie to track redirects
      response.cookies.set('auth_redirect_debug', new Date().toISOString())
      
      return response
    }
    
    // If user is authenticated, verify their email domain is allowed
    if (user?.email) {
      const userEmail = user.email
      if (!isAllowedEmailDomain(userEmail)) {
        console.log(`[DEBUG-MW] Unauthorized email domain: ${userEmail.split('@')[1]}`)
        
        // Sign the user out
        await supabase.auth.signOut()
        
        // Redirect to login with error message
        const unauthorizedUrl = createRedirectUrl('/login?error=unauthorized_domain', request)
        response = NextResponse.redirect(unauthorizedUrl)
        return response
      }
    }

    // Admin route protection for paths that start with /admin
    if (pathname.startsWith('/admin')) {
      // Check if we have a user first
      if (!user) {
        const loginUrl = createRedirectUrl('/login', request)
        response = NextResponse.redirect(loginUrl)
        return response
      }
      
      // Verify admin status in the profile table (not from user metadata)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        
      if (!profile?.is_admin) {
        // Use our utility to ensure the redirect uses the proper origin
        const dashboardUrl = createRedirectUrl('/dashboard', request)
        console.log('[DEBUG-MW] Redirecting to dashboard (not admin):', dashboardUrl.toString())
        response = NextResponse.redirect(dashboardUrl)
        return response
      }
    }
    
    // If we get here, user is authenticated and authorized
    response.headers.set('X-Auth-Debug', 'auth-success')
    
    // Return the response that may have been modified by Supabase
    return response
  } catch (error) {
    console.error('[DEBUG-MW] Middleware error:', error)
    
    // In case of any error, redirect to login
    try {
      const loginUrl = createRedirectUrl('/login', request)
      return NextResponse.redirect(loginUrl)
    } catch (redirectError) {
      // Ultimate fallback
      return NextResponse.redirect('https://app.hackathon.golf/login')
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (to prevent redirect loops in the authentication flow)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
