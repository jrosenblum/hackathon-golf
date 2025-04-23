/**
 * Authentication domain utilities (server and client safe)
 */

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
  'goacegroup.com',
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
