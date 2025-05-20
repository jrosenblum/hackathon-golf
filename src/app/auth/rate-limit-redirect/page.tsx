'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RateLimitRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Store the rate limit error details in localStorage
    localStorage.setItem('auth_error_details', 'rate_limit')
    
    // Redirect to login page with error parameter
    router.replace('/login?error=auth_error')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="animate-spin mx-auto h-12 w-12 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-center text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}