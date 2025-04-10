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
 * @param requestUrl The current request URL to extract the origin from
 * @returns A URL object with the correct origin and path
 */
export function createRedirectUrl(path: string, requestUrl: string | URL): URL {
  // If passed as string, convert to URL object
  const reqUrl = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
  
  // Create a new URL using the origin of the request URL
  return new URL(path, reqUrl.origin);
}