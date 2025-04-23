/**
 * Server-side authentication utilities
 */

import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { ALLOWED_EMAIL_DOMAINS } from './auth'

/**
 * Get the current user using the server component client
 */
export async function getCurrentUser() {
  // Add dynamic tag to tell Next.js not to statically optimize this function
  // This is needed because we use cookies which are dynamic per request
  const dynamic = 'force-dynamic';
  
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in server getCurrentUser:', error)
    return null
  }
}

/**
 * Get the current user's profile information
 * @returns The user's profile data or null if not authenticated
 */
export async function getUserProfile() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  const supabase = createServerComponentClient({ cookies })
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return profile
}

/**
 * Check if the current user is an admin
 * @returns true if the user is an admin, false if not
 * @throws redirect to login if not authenticated, redirect to dashboard if not admin
 */
export async function checkIsAdmin() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const supabase = createServerComponentClient({ cookies })
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  
  if (error || !profile?.is_admin) {
    redirect('/dashboard')
  }
  
  return true
}