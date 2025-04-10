import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createRedirectUrl } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const supabase = createClient()
      await supabase.auth.exchangeCodeForSession(code)
    }

    // Log information for debugging
    console.log('Auth callback processed with origin:', requestUrl.origin)
    
    // Create a redirect URL using the current request's origin
    const redirectUrl = createRedirectUrl('/dashboard', requestUrl)
    console.log('Redirecting to:', redirectUrl.toString())
    
    // Redirect to the dashboard
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Fallback to absolute URL if error occurs
    return NextResponse.redirect('https://app.hackathon.golf/dashboard')
  }
}
