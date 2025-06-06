'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { authConfig } from '@/lib/config'

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google')
  
  // Set the redirect URL when the component mounts in the browser
  useEffect(() => {
    // Always use window.location.origin to ensure the redirect URL
    // matches the current domain (localhost in dev, app.hackathon.golf in prod)
    const currentUrl = `${window.location.origin}/auth/callback`;
    setRedirectUrl(currentUrl);
    
    // Log for debugging
    console.log('Auth redirect URL set to:', currentUrl);
    
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'unauthorized_domain') {
      // Dynamically import to get the allowed domains list
      import('@/lib/auth').then(({ ALLOWED_EMAIL_DOMAINS }) => {
        setError(`You must use a company email address to log in. Allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
      }).catch(err => {
        console.error('Error importing allowed domains:', err);
        setError('You must use a company email address to log in.');
      });
    } else if (errorParam === 'auth_error') {
      // Check localStorage for more specific error info
      const authErrorDetails = localStorage.getItem('auth_error_details');
      if (authErrorDetails && authErrorDetails.includes('rate_limit')) {
        setError('Rate limit reached. Please wait a few minutes and try again.');
      } else {
        setError('Authentication error. Please try again or contact support if the issue persists.');
      }
      // Clear the error details from localStorage
      localStorage.removeItem('auth_error_details');
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      setLoginMethod('google')
      
      // First, clear any existing session and cookies
      // This helps prevent issues with stale state
      const supabase = createClient()
      
      // Clear any existing auth cookies to prevent conflicts
      // Delete known Supabase cookie names
      document.cookie = 'sb-wtclmehycsdgoetynaoi-auth-token=; path=/; max-age=0; domain=' + window.location.hostname
      document.cookie = 'sb-wtclmehycsdgoetynaoi-auth-token-code-verifier=; path=/; max-age=0; domain=' + window.location.hostname
      document.cookie = 'auth_session_validated=; path=/; max-age=0; domain=' + window.location.hostname
      document.cookie = 'auth_flow_started=; path=/; max-age=0; domain=' + window.location.hostname
      document.cookie = 'auth_debug=; path=/; max-age=0; domain=' + window.location.hostname
      document.cookie = 'auth_redirect_debug=; path=/; max-age=0; domain=' + window.location.hostname
      
      // Add a small delay to ensure cookies are cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Use the current origin for the redirect
      const redirectUrl = new URL('/auth/callback', window.location.origin).toString()
      console.log('Authenticating with redirect to:', redirectUrl)
      
      // Add a session cookie to track the auth flow
      document.cookie = `auth_flow_started=${Date.now()};path=/;max-age=300;SameSite=Lax`
      
      // Use signInWithOAuth and explicitly set all options
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Make sure we always get a fresh consent screen to avoid token issues
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Explicitly set these options
          skipBrowserRedirect: false,
          flowType: 'pkce',
        },
      })
      
      console.log('OAuth response:', data)
      
      if (error) throw error
      
      // The auth library should handle the redirect automatically, but in case it doesn't:
      if (data?.url) {
        console.log('Manual redirect to:', data.url)
        // Add a delay before redirect to ensure cookies are properly set
        setTimeout(() => {
          window.location.href = data.url
        }, 100)
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      
      // Check if it's a rate limit error
      if (error.status === 429 || 
          error.message?.includes('rate limit') || 
          error.code === 'over_request_rate_limit') {
        setError('Rate limit reached. Please wait a few minutes and try again.')
      } else {
        setError(error.message || 'An error occurred during login')
      }
      
      setLoading(false)
    }
    // Note: We don't set loading=false in the finally block because we're redirecting away
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    
    // Check if email domain is allowed - import isAllowedEmailDomain at the top
    try {
      // Import dynamically to avoid SSR issues
      const { isAllowedEmailDomain, ALLOWED_EMAIL_DOMAINS } = await import('@/lib/auth')
      
      if (!isAllowedEmailDomain(email)) {
        setError(`You must use a company email address to log in. Allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`)
        return
      }
    } catch (error) {
      console.error('Error checking email domain:', error)
    }
    
    try {
      setLoading(true)
      setError(null)
      setLoginMethod('email')
      
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // If successful, redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Check if it's a rate limit error
      if (error.status === 429 || 
          error.message?.includes('rate limit') || 
          error.code === 'over_request_rate_limit') {
        setError('Rate limit reached. Please wait a few minutes and try again.')
      } else {
        setError(error.message || 'An error occurred during login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    
    // Check if email domain is allowed
    try {
      // Import dynamically to avoid SSR issues
      const { isAllowedEmailDomain, ALLOWED_EMAIL_DOMAINS } = await import('@/lib/auth')
      
      if (!isAllowedEmailDomain(email)) {
        setError(`You must use a company email address to sign up. Allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`)
        return
      }
    } catch (error) {
      console.error('Error checking email domain:', error)
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl || authConfig.getRedirectUrl(),
        },
      })
      
      if (error) throw error
      
      // Show success message
      setError('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if it's a rate limit error
      if (error.status === 429 || 
          error.message?.includes('rate limit') || 
          error.code === 'over_request_rate_limit') {
        setError('Rate limit reached. Please wait a few minutes and try again.')
      } else {
        setError(error.message || 'An error occurred during signup')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className={`mb-4 rounded-md p-4 ${error.includes('Verification email sent') ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {error.includes('Verification email sent') ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${error.includes('Verification email sent') ? 'text-green-800' : 'text-red-800'}`}>
                {error.includes('Verification email sent') ? 'Success' : 'Authentication error'}
              </h3>
              <div className={`mt-2 text-sm ${error.includes('Verification email sent') ? 'text-green-700' : 'text-red-700'}`}>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email and Password Login Form */}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Please use an email address from your company domain</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading && loginMethod === 'google'}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && loginMethod === 'google' ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {loading && loginMethod === 'google' ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  )
}