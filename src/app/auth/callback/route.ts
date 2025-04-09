import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Log information for debugging
  console.log('Auth callback processed, redirecting to dashboard')
  console.log('Request URL:', request.url)
  
  // Get the origin of the current request
  const origin = requestUrl.origin;
  
  // URL to redirect to after sign in process completes
  // Use the same origin as the current request to ensure consistency
  return NextResponse.redirect(new URL('/dashboard', origin))
}
