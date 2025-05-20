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
      
      // Add code to debug PKCE flow
      console.log('Auth callback: Code verifier cookie present:', 
        request.cookies.has('sb-wtclmehycsdgoetynaoi-auth-token-code-verifier') || 
        request.cookies.has('sb-auth-token-code-verifier')
      );
      
      // Try to get the session directly instead of exchanging the code
      // This is more reliable in Next.js when cookies are properly synchronized
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        console.log('Auth callback: Session already established, skipping code exchange');
        // Session exists, continue with the flow
      } else {
        // No session yet, try to exchange the code
        try {
          console.log('Auth callback: Attempting to exchange code for session');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Auth callback: Error exchanging code for session', exchangeError);
            console.error('Error details:', JSON.stringify(exchangeError));
            
            // Even with an error, we might still have a session (race condition)
            const { data: retrySession } = await supabase.auth.getSession();
            if (!retrySession?.session) {
              let errorUrl;
              
              // Check if it's a rate limit error
              if (exchangeError.status === 429 || 
                  exchangeError.message?.includes('rate limit') ||
                  exchangeError.code === 'over_request_rate_limit') {
                // Generate a URL with client-side script to store rate limit error info
                errorUrl = new URL(createRedirectUrl('/login', request));
                errorUrl.pathname = '/auth/rate-limit-redirect';
                return NextResponse.redirect(errorUrl);
              } else {
                // Generic auth error
                errorUrl = createRedirectUrl('/login?error=auth_error', request);
              }
              
              return NextResponse.redirect(errorUrl);
            }
          }
        } catch (exchangeError: any) {
          console.error('Auth callback: Exception exchanging code', exchangeError);
          // Check if we have a session anyway
          const { data: emergencySession } = await supabase.auth.getSession();
          if (!emergencySession?.session) {
            let errorUrl;
            
            // Check if it's a rate limit error
            if (exchangeError?.status === 429 || 
                exchangeError?.message?.includes('rate limit') ||
                exchangeError?.code === 'over_request_rate_limit' ||
                JSON.stringify(exchangeError).includes('rate_limit')) {
              // Generate a URL with client-side script to store rate limit error info
              errorUrl = new URL(createRedirectUrl('/login', request));
              errorUrl.pathname = '/auth/rate-limit-redirect';
            } else {
              // Generic auth error
              errorUrl = createRedirectUrl('/login?error=auth_error', request);
            }
            
            return NextResponse.redirect(errorUrl);
          }
        }
      }
      
      // Get the user to check domain restrictions - wait for session to be fully established
      console.log('Auth callback: Waiting for session to be established...')
      
      // Make multiple attempts to get the user to ensure session is established
      let user = null
      let userError = null
      
      // Try up to 3 times with a small delay between attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Auth callback: Attempt ${attempt} to get user data`)
        const result = await supabase.auth.getUser()
        
        if (result.data?.user) {
          user = result.data.user
          break
        } else {
          userError = result.error
          // Wait 100ms before trying again
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }
      
      if (userError || !user) {
        console.error('Auth callback: Error getting user after multiple attempts', userError)
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
      console.log('Auth callback: User authenticated', user.id)
      
      // Create the response with proper cookies and session info
      const response = NextResponse.redirect(redirectUrl)
      
      // Add additional session validation cookie
      response.cookies.set({
        name: 'auth_session_validated', 
        value: 'true',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      // Set cache control headers
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
    } else {
      console.log('Auth callback: No code provided in URL')
      // If no code, redirect to the dashboard anyway and let middleware handle auth check
      const response = NextResponse.redirect(redirectUrl)
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Fallback to absolute URL if error occurs
    return NextResponse.redirect('https://app.hackathon.golf/login?error=unexpected')
  }
}
