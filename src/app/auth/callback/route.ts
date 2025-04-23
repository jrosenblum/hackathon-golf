import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createRedirectUrl } from '@/lib/utils'
import { isAllowedEmailDomain } from '@/lib/auth.domains'

// This route needs to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Create a response early so we can use it to set cookies
    const redirectUrl = createRedirectUrl('/dashboard', request)
    
    // Create a supabase client specifically for this route handler
    const supabase = createRouteHandlerClient({ cookies })
    
    // If code exists in the URL, exchange it for a session
    if (code) {
      console.log('Auth callback: Exchanging code for session')
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Auth callback: Error exchanging code for session', exchangeError)
        console.error('Error details:', JSON.stringify(exchangeError))
        const errorUrl = createRedirectUrl('/login?error=auth_error', request)
        return NextResponse.redirect(errorUrl)
      }
      
      // Get the user to check domain restrictions
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth callback: Error getting user', userError)
        console.error('Error details:', JSON.stringify(userError))
        const errorUrl = createRedirectUrl('/login?error=auth_error', request)
        return NextResponse.redirect(errorUrl)
      }
      
      if (user?.email && !isAllowedEmailDomain(user.email)) {
        console.log(`Unauthorized email domain: ${user.email.split('@')[1]}`)
        
        // Sign out the user with unauthorized domain
        await supabase.auth.signOut()
        
        // Redirect to login with error
        const unauthorizedUrl = createRedirectUrl('/login?error=unauthorized_domain', request)
        return NextResponse.redirect(unauthorizedUrl)
      }
      
      // Log successful authentication
      if (user) {
        console.log('Auth callback: User authenticated', user.id)
      }
    } else {
      console.log('Auth callback: No code provided in URL')
    }
    
    // Log headers for debugging
    console.log('Auth callback processing')
    console.log('Request headers:', {
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto: request.headers.get('x-forwarded-proto')
    })
    
    console.log('Redirecting to:', redirectUrl.toString())
    
    // Create the response with no-cache headers
    const response = NextResponse.redirect(redirectUrl)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Add debug cookies
    response.cookies.set({
      name: 'auth_debug',
      value: 'callback_completed',
      maxAge: 60 * 60 * 24,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    return response
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Fallback to absolute URL if error occurs
    return NextResponse.redirect('https://app.hackathon.golf/login?error=unexpected')
  }
}
