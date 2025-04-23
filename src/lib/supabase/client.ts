import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// This is the PUBLIC client that runs in the browser
// It should only have access to operations allowed for logged-in users
// via Supabase RLS policies

export function createClient() {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}