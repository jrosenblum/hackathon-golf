'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function CreateTeamPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noActiveHackathon, setNoActiveHackathon] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeHackathons, setActiveHackathons] = useState<any[]>([])
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('')
  
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [neededSkills, setNeededSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  // Check for active hackathons when the component mounts
  useEffect(() => {
    const fetchActiveHackathons = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get hackathon from URL query parameter if available
        const urlParams = new URLSearchParams(window.location.search);
        const hackathonIdFromUrl = urlParams.get('hackathon');
        
        // Get all active hackathons
        const { data: hackathons, error } = await supabase
          .from('hackathons')
          .select('id, title')
          .eq('is_active', true)
          .order('start_date', { ascending: false })
        
        if (error) throw error
        
        if (!hackathons || hackathons.length === 0) {
          setNoActiveHackathon(true)
        } else {
          setActiveHackathons(hackathons)
          
          // Set selected hackathon to the one from URL, or default to the first one
          if (hackathonIdFromUrl && hackathons.some(h => h.id === hackathonIdFromUrl)) {
            setSelectedHackathonId(hackathonIdFromUrl)
          } else {
            setSelectedHackathonId(hackathons[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching active hackathons:', error)
        setError('Could not fetch active hackathons')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchActiveHackathons()
  }, [])

  const addSkill = () => {
    if (skillInput.trim() && !neededSkills.includes(skillInput.trim())) {
      setNeededSkills([...neededSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setNeededSkills(neededSkills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (noActiveHackathon) {
      setError('Cannot create a team: No active hackathon found')
      return
    }
    
    if (!selectedHackathonId) {
      setError('Please select a hackathon to create a team for')
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if user is already a member of a team in this hackathon
      const { data: existingMemberships, error: membershipError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(hackathon_id)
        `)
        .eq('user_id', user.id)
        .eq('teams.hackathon_id', selectedHackathonId)
        .eq('is_approved', true)
      
      if (membershipError) throw new Error('Could not check existing team memberships')
      
      if (existingMemberships && existingMemberships.length > 0) {
        throw new Error('You are already a member of a team in this hackathon. Please leave that team before creating a new one.')
      }

      // Create team and add creator as team leader in a single function call
      // We'll use a serverless function or stored procedure in a production app
      // For now, create team first and handle error for member creation
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          hackathon_id: selectedHackathonId,
          name: teamName,
          description,
          needed_skills: neededSkills,
          created_by: user.id,
          looking_for_members: true
        })
        .select('id')
      
      if (teamError) throw new Error(teamError.message)
      
      // Add creator as an approved team leader
      if (teamData && teamData.length > 0) {
        try {
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: teamData[0].id,
              user_id: user.id,
              is_approved: true,
              is_leader: true
            })
            
          if (memberError) {
            console.error('Error adding team creator as member:', memberError)
            // Continue anyway since the team was created successfully
          }
        } catch (memberError) {
          console.error('Exception adding team creator as member:', memberError)
          // Continue anyway since the team was created successfully
        }
      }
      
      // Redirect to teams page
      router.push('/teams')
      router.refresh()
    } catch (error) {
      console.error('Error creating team:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while creating the team')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show a message if there's no active hackathon
  if (noActiveHackathon) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Hackathon</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There is no active hackathon at this time. Teams can only be created during active hackathons.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show loading state while checking for active hackathon
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create a New Team</h1>
            <p className="mt-2 text-gray-600">
              Form a team for the hackathon and specify the skills you&apos;re looking for
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/teams"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Teams
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">There was an error creating your team</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="hackathon" className="block text-sm font-medium text-gray-700 mb-1">Hackathon</label>
                  <select
                    id="hackathon"
                    name="hackathon"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={selectedHackathonId}
                    onChange={(e) => setSelectedHackathonId(e.target.value)}
                    required
                  >
                    {activeHackathons.map((hackathon) => (
                      <option key={hackathon.id} value={hackathon.id}>
                        {hackathon.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    name="team-name"
                    id="team-name"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Describe your team's mission and project idea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">Briefly describe your team&apos;s focus and what you hope to build.</p>
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills Needed</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="React, Python, Data Science, etc."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm hover:bg-gray-100"
                      onClick={addSkill}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Press Enter or click Add after each skill.</p>

                  {neededSkills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {neededSkills.map((skill) => (
                          <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                            <button
                              type="button"
                              className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                              onClick={() => removeSkill(skill)}
                            >
                              <span className="sr-only">Remove {skill}</span>
                              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}