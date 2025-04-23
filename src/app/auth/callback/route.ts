import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createRedirectUrl } from '@/lib/utils'
import { isAllowedEmailDomain } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Create a response early so we can use it to set cookies
    const redirectUrl = createRedirectUrl('/dashboard', request)
    const response = NextResponse.redirect(redirectUrl)
    
    if (code) {
      // Create a server client that can set cookies on the response
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return request.cookies.get(name)?.value
            },
            set(name, value, options) {
              // This is important! We need to set cookies on the response
              response.cookies.set({ name, value, ...options })
            },
            remove(name, options) {
              response.cookies.set({ name, value: '', ...options, maxAge: 0 })
            }
          }
        }
      )
      
      console.log('Auth callback: Exchanging code for session')
      
      // Exchange the code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Auth callback: Error exchanging code for session', exchangeError)
        const errorUrl = createRedirectUrl('/login?error=auth_error', request)
        return NextResponse.redirect(errorUrl)
      }
      
      // Check if the user's email domain is allowed
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth callback: Error getting user', userError)
        const errorUrl = createRedirectUrl('/login?error=auth_error', request)
        return NextResponse.redirect(errorUrl)
      }
      
      if (user) {
        console.log('Auth callback: User authenticated', user.id)
        const userEmail = user.email
        
        // Set debug cookies so we can track that auth was successful
        response.cookies.set({
          name: 'auth_debug',
          value: `user:${user.id}`,
          maxAge: 60 * 60 * 24,
          path: '/',
          httpOnly: false
        })
        
        // Add another cookie with timestamp
        response.cookies.set({
          name: 'auth_time',
          value: new Date().toISOString(),
          maxAge: 60 * 60 * 24,
          path: '/',
          httpOnly: false
        })
        
        // If the email doesn't belong to an allowed domain, sign them out
        if (userEmail && !isAllowedEmailDomain(userEmail)) {
          console.log(`Unauthorized email domain: ${userEmail.split('@')[1]}`)
          
          // Sign the user out
          await supabase.auth.signOut()
          
          // Create a URL for the unauthorized page
          const unauthorizedUrl = createRedirectUrl('/login?error=unauthorized_domain', request)
          return NextResponse.redirect(unauthorizedUrl)
        }
      } else {
        console.log('Auth callback: No user found after exchange')
      }
    } else {
      console.log('Auth callback: No code provided in URL')
    }

    // Log information for debugging
    console.log('Auth callback processing')
    console.log('Request headers:', {
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto: request.headers.get('x-forwarded-proto')
    })
    
    console.log('Redirecting to:', redirectUrl.toString())
    
    // Add cache control headers to prevent caching issues
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Return the response object that already has cookies set
    return response
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Fallback to absolute URL if error occurs
    return NextResponse.redirect('https://app.hackathon.golf/login?error=unexpected')
  }
}
