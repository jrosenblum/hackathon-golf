'use client'

import { createClient } from '@/lib/supabase/client'
import Header from './Header'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// This is a client component wrapper that ensures Header receives user data
export default function AuthHeader() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (error || !authUser) {
          setLoading(false)
          return
        }
        
        setUser(authUser)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
    
    // Setup auth state change listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/')
        } else if (session) {
          // Use getUser to validate session data
          supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
              setUser(data.user)
            }
          })
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router])
  
  if (loading) {
    return (
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <div className="animate-pulse h-5 w-32 bg-gray-200 rounded"></div>
        </div>
      </header>
    )
  }
  
  if (!user) return null
  
  return <Header user={user} />
}