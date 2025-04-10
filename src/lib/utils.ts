/**
 * Utility functions for handling URLs and redirects
 */

/**
 * Gets the base URL for the application
 * This will use the deployment URL in production, or localhost in development
 */
export function getBaseUrl() {
  // Check if we're running in a browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side - use environment variables or default to the production URL
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.HEROKU_APP_NAME ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` : null) ||
    'https://app.hackathon.golf'
  );
}

/**
 * Safely creates an absolute URL using the proper base
 * @param path The path to append to the base URL
 * @returns A fully qualified URL
 */
export function createUrl(path: string): string {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Creates a URL object using the current origin
 * This is helpful for redirects since it ensures the proper origin is used
 * @param path The path to redirect to
 * @param request The current request object or URL to extract the origin from
 * @returns A URL object with the correct origin and path
 */
export function createRedirectUrl(path: string, request: Request | URL | string): URL {
  let origin: string;
  
  // Check if it's a Request object with headers
  if (typeof request === 'object' && 'headers' in request) {
    // Try to get the host from X-Forwarded-Host or Host headers
    const host = request.headers.get('x-forwarded-host') || 
                request.headers.get('host') || 
                'app.hackathon.golf';
    
    // Get the protocol (defaulting to https)
    const protocol = (request.headers.get('x-forwarded-proto') || 'https').split(',')[0];
    
    // Construct the origin
    origin = `${protocol}://${host}`;
    
    console.log('Using origin from headers:', origin);
  } else {
    // If passed as string or URL object, extract origin as before
    const reqUrl = typeof request === 'string' ? new URL(request) : request;
    origin = reqUrl.origin;
    
    // Special case for Heroku internal URLs
    if (origin.includes('localhost:') || origin.includes('127.0.0.1:')) {
      // Override with production URL if we detect local/internal URLs in production
      if (process.env.NODE_ENV === 'production') {
        origin = 'https://app.hackathon.golf';
        console.log('Overriding internal URL with production domain');
      }
    }
  }
  
  // Create a new URL using the derived origin
  return new URL(path, origin);
}