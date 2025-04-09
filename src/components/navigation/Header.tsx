'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header({ user }: { user: any }) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                Hackathon Platform
              </Link>
            </div>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link 
                href="/dashboard" 
                className="text-gray-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-blue-600"
              >
                Dashboard
              </Link>
              <Link 
                href="/teams" 
                className="text-gray-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-blue-600"
              >
                Teams
              </Link>
              <Link 
                href="/projects" 
                className="text-gray-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-blue-600"
              >
                Projects
              </Link>
              {user?.user_metadata?.isAdmin && (
                <Link 
                  href="/admin" 
                  className="text-gray-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-blue-600"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/dashboard" className="text-gray-500 hover:bg-gray-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
            Dashboard
          </Link>
          <Link href="/teams" className="text-gray-500 hover:bg-gray-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
            Teams
          </Link>
          <Link href="/projects" className="text-gray-500 hover:bg-gray-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
            Projects
          </Link>
          {user?.user_metadata?.isAdmin && (
            <Link href="/admin" className="text-gray-500 hover:bg-gray-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              Admin
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div>
              <div className="text-base font-medium text-gray-800">
                {user?.user_metadata?.full_name || user?.email}
              </div>
              <div className="text-sm font-medium text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="mt-3 px-4 pb-2">
            <button
              onClick={handleSignOut}
              className="w-full inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
