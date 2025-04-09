/**
 * Site configuration and environment variables
 */

// Default to localhost for local development
const DEFAULT_SITE_URL = 'http://localhost:3000';

// Get the site URL from environment or use default
export const siteUrl = 
  process.env.NEXT_PUBLIC_SITE_URL || 
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
  process.env.RENDER_EXTERNAL_URL ||
  process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : 
  DEFAULT_SITE_URL;

// Auth configuration
export const authConfig = {
  // Append the auth callback path to the site URL
  redirectUrl: `${siteUrl}/auth/callback`
};