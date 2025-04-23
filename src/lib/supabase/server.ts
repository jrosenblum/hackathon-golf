import { createClient as createBrowserClient } from '@supabase/supabase-js'

// This utility determines if we're in a browser context to avoid using headers API server-side
const isBrowser = typeof window !== 'undefined'

/**
 * Create a client for server contexts
 * This uses the direct client with environment variables
 */
export async function createClient() {
  // For server contexts, just return a direct client
  // The auth helpers should be used directly in each server component/route handler
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}