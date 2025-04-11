import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createRedirectUrl } from '@/lib/utils'
import { isAllowedEmailDomain, ALLOWED_EMAIL_DOMAINS } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const supabase = await createClient()
      await supabase.auth.exchangeCodeForSession(code)
      
      // Check if the user's email domain is allowed
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const userEmail = session.user.email
        
        // If the email doesn't belong to an allowed domain, sign them out
        if (userEmail && !isAllowedEmailDomain(userEmail)) {
          console.log(`Unauthorized email domain: ${userEmail.split('@')[1]}`)
          
          // Sign the user out
          await supabase.auth.signOut()
          
          // Create a URL for the unauthorized page
          const unauthorizedUrl = createRedirectUrl('/login?error=unauthorized_domain', request)
          return NextResponse.redirect(unauthorizedUrl)
        }
      }
    }

    // Log information for debugging
    console.log('Auth callback processing')
    console.log('Request headers:', {
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto: request.headers.get('x-forwarded-proto')
    })
    
    // Use the request object directly to access the headers 
    // for detecting the real origin in production
    const redirectUrl = createRedirectUrl('/dashboard', request)
    console.log('Redirecting to:', redirectUrl.toString())
    
    // Redirect to the dashboard using the properly detected origin
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Fallback to absolute URL if error occurs
    return NextResponse.redirect('https://app.hackathon.golf/dashboard')
  }
}
