/**
 * Authentication utilities
 */

// Mark this file as safe to use in client components
'use client'

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

/**
 * Get the current user using the secure getUser() method
 * This is more secure than getSession() as it authenticates data with the Supabase Auth server
 */
export async function getCurrentUser() {
  try {
    // Use in a try/catch since we can't pass cookies directly in this context
    // but the client should still work with the environment cookies
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
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
  
  const supabase = await createClient()
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
  
  const supabase = await createClient()
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

// Import from the shared domains file
import { ALLOWED_EMAIL_DOMAINS, isAllowedEmailDomain } from './auth.domains'

// Re-export for convenience
export { ALLOWED_EMAIL_DOMAINS, isAllowedEmailDomain }
