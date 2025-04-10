'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function CreateProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noActiveHackathon, setNoActiveHackathon] = useState(false)
  const [noTeam, setNoTeam] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userTeams, setUserTeams] = useState<any[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [category, setCategory] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [resourcesUrl, setResourcesUrl] = useState('')

  // Check if there's an active hackathon and get user's teams when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Check for active hackathon
        const { data: hackathons, error: hackathonError } = await supabase
          .from('hackathons')
          .select('id')
          .eq('is_active', true)
          .limit(1)
        
        if (hackathonError) throw hackathonError
        
        if (!hackathons || hackathons.length === 0) {
          setNoActiveHackathon(true)
          setIsLoading(false)
          return
        }

        // Get user's teams
        const { data: teams, error: teamsError } = await supabase
          .from('team_members')
          .select(`
            is_leader,
            teams (
              id,
              name,
              hackathon_id
            )
          `)
          .eq('user_id', user.id)
          .eq('is_approved', true)
          .eq('teams.hackathon_id', hackathons[0].id)
        
        if (teamsError) throw teamsError
        
        if (!teams || teams.length === 0) {
          setNoTeam(true)
          setIsLoading(false)
          return
        }

        const formattedTeams = teams.map(membership => ({
          id: membership.teams.id,
          name: membership.teams.name,
          isLeader: membership.is_leader
        }))

        setUserTeams(formattedTeams)
        
        // If user only has one team, select it by default
        if (formattedTeams.length === 1) {
          setTeamId(formattedTeams[0].id)
        }
      } catch (error) {
        console.error('Error initializing project submission:', error)
        setError('Could not initialize project submission')
      } finally {
        setIsLoading(false)
      }
    }
    
    initialize()
  }, [router])

  const addTechnology = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()])
      setTechInput('')
    }
  }

  const removeTechnology = (techToRemove: string) => {
    setTechnologies(technologies.filter(tech => tech !== techToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (noActiveHackathon) {
      setError('Cannot submit a project: No active hackathon found')
      return
    }
    
    if (noTeam) {
      setError('Cannot submit a project: You must join or create a team first')
      return
    }
    
    if (!teamId) {
      setError('Please select a team for this project')
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          team_id: teamId,
          category,
          technologies,
          video_url: videoUrl || null,
          resources_url: resourcesUrl || null,
          is_submitted: true,
          submission_date: new Date().toISOString(),
          submitted_by: user.id
        })
        .select()
      
      if (projectError) throw new Error(projectError.message)
      
      // Redirect to projects page
      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Error submitting project:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while submitting the project')
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
                  There is no active hackathon at this time. Projects can only be submitted during active hackathons.
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

  // Show a message if the user doesn't have a team
  if (noTeam) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Team Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You need to join or create a team before you can submit a project.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <Link
                    href="/teams"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Teams
                  </Link>
                  <Link
                    href="/teams/create"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Create a Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show loading state while checking for active hackathon & teams
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

  const categories = [
    "Web Application",
    "Mobile App",
    "AI/ML",
    "Data Visualization",
    "DevOps",
    "IoT",
    "Blockchain",
    "Gaming",
    "Accessibility",
    "Other"
  ]

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Submit Your Project</h1>
            <p className="mt-2 text-gray-600">
              Share your team&apos;s hackathon submission with the community
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Projects
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
                <h3 className="text-sm font-medium text-red-800">There was an error submitting your project</h3>
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
                  <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    id="team"
                    name="team"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    required
                  >
                    <option value="">Select your team</option>
                    {userTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.isLeader ? "(Leader)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-gray-500">Select the team that worked on this project.</p>
                </div>

                <div>
                  <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    name="project-title"
                    id="project-title"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="category"
                    name="category"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Describe your project, its purpose, and how it works"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">Provide a clear and detailed description of your project. What problem does it solve? How does it work?</p>
                </div>

                
                <div>
                  <label htmlFor="resources-url" className="block text-sm font-medium text-gray-700 mb-1">Resources Link (Optional)</label>
                  <input
                    type="url"
                    name="resources-url"
                    id="resources-url"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://github.com/your-username/your-project"
                    value={resourcesUrl}
                    onChange={(e) => setResourcesUrl(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-500">Add a link to your project's source code repository.</p>
                </div>
                
                <div>
                  <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">Demo Video Link (Optional)</label>
                  <input
                    type="url"
                    name="video-url"
                    id="video-url"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://www.youtube.com/watch?v=example"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-500">Add a link to your project's demo video or presentation.</p>
                </div>

                <div>
                  <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="technologies"
                      id="technologies"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="React, Node.js, MongoDB, etc."
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm hover:bg-gray-100"
                      onClick={addTechnology}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Press Enter or click Add after each technology.</p>

                  {technologies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => (
                          <span key={tech} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {tech}
                            <button
                              type="button"
                              className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                              onClick={() => removeTechnology(tech)}
                            >
                              <span className="sr-only">Remove {tech}</span>
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
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}