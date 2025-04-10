import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Let's try the simplest approach: use cookies() dynamically
// This way Next.js will know this is an async component
export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // In getters we read from the "static" snapshot we took earlier
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge: number; domain?: string }) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // We can safely ignore since we're not writing cookies server-side
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: { path: string; domain?: string }) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          } catch (error) {
            // We can safely ignore since we're not writing cookies server-side
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}
