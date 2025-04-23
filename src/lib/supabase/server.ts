import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

// This utility determines if we're in a browser context to avoid using headers API server-side
const isBrowser = typeof window !== 'undefined'

/**
 * Create a client that works in either server or client contexts
 * This implementation is compatible with both Next.js App Router and Pages Router
 */
export async function createClient() {
  if (isBrowser) {
    // For browser usage, we just use the browser client
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // For server usage, we need to check if cookies can be accessed from the environment
  let cookieStore: any

  try {
    // First try the Next.js App Router cookies API
    // This will throw in Pages Router, so we handle that in the catch block
    cookieStore = (await import('next/headers')).cookies()
  } catch (e) {
    // If using Pages Router or the cookies API isn't available,
    // we fall back to a simple client without cookie access
    // This is less secure but works with Heroku deployments
    console.log('[DEBUG] Server: Falling back to browser client for compatibility')
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // If we have cookies access, use it for a more secure server-side client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // We don't need to implement set and remove for read-only server components
        set() {},
        remove() {}
      }
    }
  )
}