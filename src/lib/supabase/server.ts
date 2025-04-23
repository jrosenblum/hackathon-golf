import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This creates a server-side Supabase client.
// This client is created using the public anon key but provides
// user context from cookies. It has the same permissions as the
// authenticated user from cookies.
export async function createClient() {
  // Get the cookies from the request
  const cookieStore = cookies()
  
  // Create a server client with enhanced security
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // This is the correct pattern: get all cookies upfront then access them
        async get(name) {
          // Use the async method to properly await cookies
          const allCookies = await cookieStore.getAll()
          const cookie = allCookies.find(cookie => cookie.name === name)
          return cookie?.value
        },
        set(name, value, options) {
          try {
            // Set the cookie with the options provided
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // We can safely ignore since we're not writing cookies server-side
            console.error('Error setting cookie:', error)
          }
        },
        remove(name, options) {
          try {
            // Remove the cookie by setting it with maxAge=0
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // We can safely ignore since we're not writing cookies server-side
            console.error('Error removing cookie:', error)
          }
        }
      }
    }
  )
}