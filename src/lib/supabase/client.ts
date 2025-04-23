import { createBrowserClient } from '@supabase/ssr'

// This is the PUBLIC client that runs in the browser
// It should only have access to operations allowed for logged-in users
// via Supabase RLS policies

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}