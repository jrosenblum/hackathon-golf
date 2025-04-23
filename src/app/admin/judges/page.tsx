'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function JudgesPage() {
  const router = useRouter()
  const [judges, setJudges] = useState<any[]>([])
  const [hackathons, setHackathons] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedHackathon, setSelectedHackathon] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Load hackathons, judges, and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Fetch active hackathons
        const { data: hackathonData, error: hackathonError } = await supabase
          .from('hackathons')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (hackathonError) throw new Error('Error fetching hackathons')
        setHackathons(hackathonData || [])
        
        // Set default selected hackathon to the first one
        if (hackathonData && hackathonData.length > 0) {
          setSelectedHackathon(hackathonData[0].id)
          await fetchJudges(hackathonData[0].id)
        }
        
        // Fetch users
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name', { ascending: true })
        
        if (userError) throw new Error('Error fetching users')
        setUsers(userData || [])
        
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Fetch judges for a specific hackathon
  const fetchJudges = async (hackathonId: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('judges')
        .select(`
          id,
          user_id,
          hackathon_id,
          created_at,
          profiles(id, full_name, email, avatar_url)
        `)
        .eq('hackathon_id', hackathonId)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error('Error fetching judges')
      setJudges(data || [])
      
    } catch (error) {
      console.error('Error fetching judges:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while fetching judges')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle hackathon change
  const handleHackathonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hackathonId = e.target.value
    setSelectedHackathon(hackathonId)
    await fetchJudges(hackathonId)
  }
  
  // Handle adding a new judge
  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHackathon || !selectedUser) {
      setError('Please select both a hackathon and a user')
      return
    }
    
    // Check if user is already a judge for this hackathon
    const existingJudge = judges.find(judge => judge.user_id === selectedUser)
    if (existingJudge) {
      setError('This user is already a judge for this hackathon')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      const { error } = await supabase
        .from('judges')
        .insert({
          hackathon_id: selectedHackathon,
          user_id: selectedUser
        })
      
      if (error) throw new Error(error.message)
      
      // Refresh judge list
      await fetchJudges(selectedHackathon)
      setSuccessMessage('Judge added successfully')
      setSelectedUser('')
      
    } catch (error) {
      console.error('Error adding judge:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while adding the judge')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle removing a judge
  const handleRemoveJudge = async (judgeId: string) => {
    if (!confirm('Are you sure you want to remove this judge?')) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      const { error } = await supabase
        .from('judges')
        .delete()
        .eq('id', judgeId)
      
      if (error) throw new Error(error.message)
      
      // Refresh judge list
      await fetchJudges(selectedHackathon)
      setSuccessMessage('Judge removed successfully')
      
    } catch (error) {
      console.error('Error removing judge:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while removing the judge')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Judges</h1>
            <p className="mt-2 text-gray-600">
              Assign judges to hackathons and manage their permissions
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin
            </Link>
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-lg bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="mt-2 text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Hackathon Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Hackathon</h2>
          <div className="max-w-md">
            <label htmlFor="hackathon-select" className="block text-sm font-medium text-gray-700 mb-1">
              Hackathon
            </label>
            <select
              id="hackathon-select"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={selectedHackathon}
              onChange={handleHackathonChange}
              disabled={isLoading}
            >
              {hackathons.length === 0 && <option value="">No hackathons available</option>}
              {hackathons.map((hackathon) => (
                <option key={hackathon.id} value={hackathon.id}>
                  {hackathon.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Add Judge Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Judge</h2>
          <form onSubmit={handleAddJudge} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                id="user-select"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email || user.id}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Judge'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Judges List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Judges</h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">Loading judges...</p>
            </div>
          ) : judges.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Judges Assigned</h3>
              <p className="mt-1 text-gray-500">Add judges using the form above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {judges.map((judge) => (
                <li key={judge.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {judge.profiles?.avatar_url ? (
                          <img 
                            src={judge.profiles.avatar_url}
                            alt={judge.profiles.full_name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          {judge.profiles?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">{judge.profiles?.email || ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveJudge(judge.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  )
}