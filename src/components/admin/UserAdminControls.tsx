'use client'

import { useState } from 'react'

interface UserAdminControlsProps {
  userId: string
  isAdmin: boolean
}

export default function UserAdminControls({ userId, isAdmin: initialIsAdmin }: UserAdminControlsProps) {
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const toggleAdminStatus = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Use the secure API route instead of direct database access
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateUserAdmin',
          data: {
            userId,
            isAdmin: !isAdmin,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update admin status')
      }

      // Update the local state
      setIsAdmin(!isAdmin)
      setSuccess(!isAdmin ? 'User promoted to admin' : 'Admin privileges removed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating admin status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}
      
      <button
        onClick={toggleAdminStatus}
        disabled={isLoading}
        className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none ${
          isAdmin
            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
            : 'border-purple-300 text-purple-700 bg-white hover:bg-purple-50'
        }`}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {isAdmin ? 'Remove Admin Privileges' : 'Make Admin'}
      </button>
    </div>
  )
}