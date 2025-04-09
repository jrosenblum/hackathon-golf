/**
 * Site configuration and environment variables
 */

// Auth configuration with safe fallbacks for both client and server side
export const authConfig = {
  // This should be set on the client side dynamically
  // via window.location.origin to ensure it always matches
  // the current domain
  getRedirectUrl: () => {
    // When in browser
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    
    // Server-side fallback with environment variables
    const siteUrl = 
      process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : null) ||
      'https://app.hackathon.golf';
      
    return `${siteUrl}/auth/callback`;
  }
};