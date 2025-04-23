'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Profile data
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [interestInput, setInterestInput] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Team data
  const [userTeams, setUserTeams] = useState<any[]>([])
  
  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        // Get profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        
        if (profile) {
          setFullName(profile.full_name || '')
          setEmail(profile.email || '')
          setDepartment(profile.department || '')
          setRole(profile.role || '')
          setSkills(profile.skills || [])
          setInterests(profile.interests || [])
          setAvatarUrl(profile.avatar_url || '')
        }
        
        try {
          // Get user's teams using a simpler query first
          const { data: teamMemberships, error: teamsError } = await supabase
            .from('team_members')
            .select(`
              id,
              is_leader,
              is_approved,
              team_id
            `)
            .eq('user_id', user.id)
            .eq('is_approved', true)
            
          if (teamsError) throw teamsError
          
          if (!teamMemberships || teamMemberships.length === 0) {
            // No teams found
            setUserTeams([])
          } else {
            // Get team details separately to avoid nested query issues
            const teamIds = teamMemberships.map(tm => tm.team_id)
            
            const { data: teams, error: teamDetailsError } = await supabase
              .from('teams')
              .select(`
                id,
                name,
                description,
                hackathon_id
              `)
              .in('id', teamIds)
              
            if (teamDetailsError) throw teamDetailsError
            
            // Get hackathon details separately
            const hackathonIds = teams?.map(team => team.hackathon_id).filter(Boolean) || []
            
            let hackathons = []
            if (hackathonIds.length > 0) {
              const { data: hackathonData, error: hackathonError } = await supabase
                .from('hackathons')
                .select('id, title, is_active')
                .in('id', hackathonIds)
                
              if (hackathonError) throw hackathonError
              hackathons = hackathonData || []
            }
            
            // Now combine all the data
            const formattedTeams = teamMemberships.map(membership => {
              const team = teams?.find(t => t.id === membership.team_id) || { 
                name: 'Unknown Team', 
                description: '',
                hackathon_id: null 
              }
              
              const hackathon = hackathons.find(h => h.id === team.hackathon_id) || {
                title: 'Unknown Hackathon',
                is_active: false
              }
              
              return {
                id: membership.id,
                teamId: membership.team_id,
                name: team.name,
                description: team.description || '',
                isLeader: membership.is_leader,
                isApproved: membership.is_approved,
                hackathonId: team.hackathon_id,
                hackathonTitle: hackathon.title,
                isActiveHackathon: hackathon.is_active
              }
            })
            
            setUserTeams(formattedTeams)
          }
        } catch (teamError) {
          console.error('Error loading teams:', teamError)
          // Continue with profile even if teams fail to load
          setUserTeams([])
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Could not load profile')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [router])
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          department,
          role,
          skills,
          interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        
      if (error) throw error
      
      setSuccessMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle skill management
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput('')
    }
  }
  
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }
  
  // Handle interest management
  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()])
      setInterestInput('')
    }
  }
  
  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove))
  }
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
        
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
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Basic Information */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="full-name"
                        id="full-name"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100"
                        value={email}
                        readOnly
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">Your email cannot be changed</p>
                    </div>
                  </div>
                </div>
                
                {/* Work Information */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Work Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department/Business Unit</label>
                      <input
                        type="text"
                        name="department"
                        id="department"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Job Title/Role</label>
                      <input
                        type="text"
                        name="role"
                        id="role"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Skills */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
                  <p className="text-sm text-gray-600 mb-3">
                    Add skills you have that might be relevant for hackathon projects (programming languages, tools, frameworks, etc.)
                  </p>
                  
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="React, Python, Product Management, etc."
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
                  
                  {skills.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
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
                
                {/* Interests */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Interests</h2>
                  <p className="text-sm text-gray-600 mb-3">
                    Add areas you're interested in for hackathon projects
                  </p>
                  
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="interests"
                      id="interests"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="AI, Blockchain, Sustainability, etc."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm hover:bg-gray-100"
                      onClick={addInterest}
                    >
                      Add
                    </button>
                  </div>
                  
                  {interests.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <span key={interest} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {interest}
                            <button
                              type="button"
                              className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
                              onClick={() => removeInterest(interest)}
                            >
                              <span className="sr-only">Remove {interest}</span>
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
                
                {/* Teams */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Your Teams</h2>
                  
                  {userTeams.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md text-center">
                      <p className="text-gray-600">You're not currently a member of any teams.</p>
                      <div className="mt-4">
                        <a
                          href="/teams"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Browse Teams
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userTeams.map(team => (
                        <div key={team.id} className="bg-green-50 border border-green-100 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                <a href={`/teams/${team.teamId}`} className="text-blue-600 hover:text-blue-800">
                                  {team.name}
                                </a>
                                {team.isLeader && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Team Leader
                                  </span>
                                )}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">{team.description}</p>
                              <p className="mt-2 text-xs text-gray-500">
                                Part of: {team.hackathonTitle}
                                {team.isActiveHackathon && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </p>
                            </div>
                            <a
                              href={`/teams/${team.teamId}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Team
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}