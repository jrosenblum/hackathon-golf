'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header({ user }: { user: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isJudge, setIsJudge] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingTeamRequests, setPendingTeamRequests] = useState(0)
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const dropdown = document.getElementById('user-dropdown')
      const dropdownButton = document.getElementById('user-dropdown-button')
      
      if (dropdown && dropdownButton && 
          !dropdown.contains(target) && 
          !dropdownButton.contains(target)) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Check if user is a judge for any active hackathon
  useEffect(() => {
    const checkJudgeStatus = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createClient()
        
        // Check if user is a judge for any active hackathon
        const { data, error } = await supabase
          .from('judges')
          .select(`
            id,
            hackathon_id,
            hackathons!inner(is_active)
          `)
          .eq('user_id', user.id)
          .eq('hackathons.is_active', true)
          .limit(1)
        
        if (error) {
          console.error('Error checking judge status:', error)
          return
        }
        
        setIsJudge(data && data.length > 0)
      } catch (err) {
        console.error('Error checking judge status:', err)
      }
    }
    
    checkJudgeStatus()
  }, [user?.id])
  
  // Check if user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createClient()
        
        // Check if user has admin role
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error checking admin status:', error)
          return
        }
        
        setIsAdmin(data?.is_admin === true)
      } catch (err) {
        console.error('Error checking admin status:', err)
      }
    }
    
    checkAdminStatus()
  }, [user?.id])
  
  // Check for pending team requests
  useEffect(() => {
    const checkPendingTeamRequests = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createClient()
        
        // Get pending team requests where user has requested to join
        const { data, error } = await supabase
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_approved', false)
        
        if (error) {
          console.error('Error checking pending team requests:', error)
          return
        }
        
        setPendingTeamRequests(data?.length || 0)
      } catch (err) {
        console.error('Error checking pending team requests:', err)
      }
    }
    
    checkPendingTeamRequests()
    
    // Set up real-time subscription for team_members table
    const supabase = createClient()
    const teamMembersSubscription = supabase
      .channel('table-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'team_members',
          filter: `user_id=eq.${user?.id}`
        }, 
        () => {
          // Refresh pending requests when changes occur
          checkPendingTeamRequests()
        }
      )
      .subscribe()
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(teamMembersSubscription)
    }
  }, [user?.id])
  
  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      
      // First redirect to home page - do this before signOut to ensure it happens
      window.location.href = '/'
      
      // Then sign out - this will happen after the redirect has started
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      // If there's an error, still try to redirect
      window.location.href = '/'
    }
  }
  
  // Check if a path is active (exact match or subpath)
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }
  
  // Get the nav link styling based on active state
  const getLinkClassName = (path: string) => {
    return isActive(path)
      ? "border-blue-500 text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
      : "text-gray-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-blue-600"
  }
  
  // Get the mobile nav link styling based on active state
  const getMobileLinkClassName = (path: string) => {
    return isActive(path)
      ? "bg-blue-50 text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
      : "text-gray-500 hover:bg-gray-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
  }

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <img src="/logo.png" alt="Hackathon Platform Logo" className="h-16 w-auto" />
              </Link>
            </div>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link 
                href="/dashboard" 
                className={getLinkClassName('/dashboard')}
              >
                Dashboard
              </Link>
              <Link 
                href="/teams" 
                className={getLinkClassName('/teams')}
              >
                <div className="relative flex items-center">
                  Teams
                  {pendingTeamRequests > 0 && (
                    <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-100 text-xs font-medium text-yellow-800">
                      {pendingTeamRequests}
                    </span>
                  )}
                </div>
              </Link>
              <Link 
                href="/projects" 
                className={getLinkClassName('/projects')}
              >
                Projects
              </Link>
              {isJudge && (
                <Link 
                  href="/judging" 
                  className={getLinkClassName('/judging')}
                >
                  Judging
                </Link>
              )}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={getLinkClassName('/admin')}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          {/* Desktop user menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative ml-3">
              <div>
                <button
                  id="user-dropdown-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white uppercase">
                    {user?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.user_metadata?.full_name || user?.email}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* User dropdown menu */}
              {userMenuOpen && (
                <div id="user-dropdown" className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50">
                  <div className="py-1 bg-white rounded-md shadow-xs ring-1 ring-black ring-opacity-5">
                    <Link 
                      href="/profile" 
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
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
          <Link 
            href="/dashboard" 
            className={getMobileLinkClassName('/dashboard')}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            href="/teams" 
            className={getMobileLinkClassName('/teams')}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center">
              Teams
              {pendingTeamRequests > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-medium text-yellow-800">
                  {pendingTeamRequests}
                </span>
              )}
            </div>
          </Link>
          <Link 
            href="/projects" 
            className={getMobileLinkClassName('/projects')}
            onClick={() => setIsMenuOpen(false)}
          >
            Projects
          </Link>
          {isJudge && (
            <Link 
              href="/judging" 
              className={getMobileLinkClassName('/judging')}
              onClick={() => setIsMenuOpen(false)}
            >
              Judging
            </Link>
          )}
          {isAdmin && (
            <Link 
              href="/admin" 
              className={getMobileLinkClassName('/admin')}
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          )}
        </div>
        
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white uppercase">
                {user?.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">
                {user?.user_metadata?.full_name || user?.email}
              </div>
              <div className="text-sm font-medium text-gray-500">{user?.email}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Link
              href="/profile"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Your Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
