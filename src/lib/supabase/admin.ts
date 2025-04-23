import { createClient } from '@supabase/supabase-js'

// This creates a service role client with admin privileges.
// It should ONLY be used in server-side contexts where we've 
// already verified the user has admin permissions through other means.
// Using this client bypasses Row Level Security (RLS)!
export function createAdminClient() {
  // Make sure the admin service key is set as an environment variable
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail!')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}