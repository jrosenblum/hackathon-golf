/**
 * Authentication utilities
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current user using the secure getUser() method
 * This is more secure than getSession() as it authenticates data with the Supabase Auth server
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
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

// List of allowed email domains for login
export const ALLOWED_EMAIL_DOMAINS = [
  'pulsepoint.com',
  'internetbrands.com',
  'carsdirect.com',
  'martindale.com',
  'martindale-avvo.com',
  'martindalenolo.com',
  'nolo.com',
  'healthwise.org',
  'krames.com',
  'findlaw.com',
  'webmd.net',
  'webmd.com',
  'medscape.com',
  'medscapelive.com',
  'mercuryhealthcare.com',
  'medscape.net',
  'mnghealth.com',
  'coliquio.de',
  'gruposaned.com',
  'ngagelive.com',
  'staywell.com',
  'premierdisability.com',
  'medscapelive.com',
  'demandforce.com',
  'avvo.com'
];

/**
 * Checks if an email address belongs to one of the allowed domains
 * @param email The email address to check
 * @returns True if the email is from an allowed domain, false otherwise
 */
export function isAllowedEmailDomain(email: string): boolean {
  if (!email) return false;
  
  try {
    // Extract the domain part of the email
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    // Check if the domain is in the allowed list
    return ALLOWED_EMAIL_DOMAINS.includes(domain);
  } catch (error) {
    console.error('Error checking email domain:', error);
    return false;
  }
}
