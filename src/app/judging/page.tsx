'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function JudgingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hackathons, setHackathons] = useState<any[]>([])
  const [activeHackathon, setActiveHackathon] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [judgedProjects, setJudgedProjects] = useState<any[]>([])

  useEffect(() => {
    const checkJudgeStatus = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Check if user is a judge for any active hackathon
        const { data: judgeData, error: judgeError } = await supabase
          .from('judges')
          .select(`
            id,
            hackathon_id,
            hackathons!inner(
              id,
              title,
              description,
              start_date,
              end_date,
              judging_start,
              judging_end,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .eq('hackathons.is_active', true)
        
        if (judgeError) {
          console.error('Error fetching judge hackathons:', judgeError)
          setError('Error fetching hackathons you are judging')
          setIsLoading(false)
          return
        }
        
        if (!judgeData || judgeData.length === 0) {
          setError('You are not assigned as a judge for any active hackathons')
          setIsLoading(false)
          return
        }
        
        // Format hackathons data
        const formattedHackathons = judgeData.map(item => ({
          judgeId: item.id,
          ...item.hackathons
        }))
        
        setHackathons(formattedHackathons)
        
        // Set the first hackathon as active
        const firstHackathon = formattedHackathons[0]
        setActiveHackathon(firstHackathon)
        
        // Fetch projects for the active hackathon
        await fetchProjects(firstHackathon.id, firstHackathon.judgeId, user.id)
        
      } catch (err) {
        console.error('Error checking judge status:', err)
        setError('An error occurred while loading judging information')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkJudgeStatus()
  }, [router])
  
  const fetchProjects = async (hackathonId: string, judgeId: string, userId: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Fetch all submitted projects for this hackathon
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          category,
          technologies,
          video_url,
          resources_url,
          submission_date,
          team_id,
          teams!inner (
            name,
            hackathon_id
          )
        `)
        .eq('teams.hackathon_id', hackathonId)
        .eq('is_submitted', true)
        .order('submission_date', { ascending: false })
      
      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        setError('Error fetching projects for judging')
        return
      }
      
      // Fetch projects this judge has already scored
      const { data: scoredProjectsData, error: scoredError } = await supabase
        .from('project_scores')
        .select(`
          project_id,
          criteria_id,
          score
        `)
        .eq('judge_id', judgeId)
      
      if (scoredError) {
        console.error('Error fetching scored projects:', scoredError)
      }
      
      // Group scored projects by project ID
      const scoredProjectsMap: Record<string, Set<string>> = {}
      scoredProjectsData?.forEach(score => {
        if (!scoredProjectsMap[score.project_id]) {
          scoredProjectsMap[score.project_id] = new Set()
        }
        scoredProjectsMap[score.project_id].add(score.criteria_id)
      })
      
      // Get the number of criteria for this hackathon
      const { data: criteriaCount, error: criteriaError } = await supabase
        .from('judging_criteria')
        .select('id', { count: 'exact' })
        .eq('hackathon_id', hackathonId)
      
      if (criteriaError) {
        console.error('Error fetching criteria count:', criteriaError)
      }
      
      // Determine which projects have all criteria scored
      const totalCriteria = criteriaCount?.length || 0
      const judgedProjectIds = new Set()
      
      Object.entries(scoredProjectsMap).forEach(([projectId, criteriaSet]) => {
        if (criteriaSet.size === totalCriteria) {
          judgedProjectIds.add(projectId)
        }
      })
      
      // Separate judged and unjudged projects
      const judged: any[] = []
      const unjudged: any[] = []
      
      projectsData?.forEach(project => {
        const isJudged = judgedProjectIds.has(project.id)
        const projectWithJudgingStatus = { 
          ...project, 
          isJudged,
          scoredCriteria: scoredProjectsMap[project.id]?.size || 0,
          totalCriteria
        }
        
        if (isJudged) {
          judged.push(projectWithJudgingStatus)
        } else {
          unjudged.push(projectWithJudgingStatus)
        }
      })
      
      // Set projects and judged projects
      setProjects(unjudged)
      setJudgedProjects(judged)
      
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('An error occurred while loading projects')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleHackathonChange = async (hackathonId: string) => {
    const hackathon = hackathons.find(h => h.id === hackathonId)
    if (hackathon) {
      setActiveHackathon(hackathon)
      
      // Get current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetchProjects(hackathon.id, hackathon.judgeId, user.id)
      }
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  // Check if judging period is active
  const isJudgingActive = (hackathon: any) => {
    if (!hackathon) return false
    
    const now = new Date()
    const judgingStart = new Date(hackathon.judging_start)
    const judgingEnd = new Date(hackathon.judging_end)
    
    return now >= judgingStart && now <= judgingEnd
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judging Panel</h1>
            <p className="mt-2 text-gray-600">
              Review and score hackathon projects
            </p>
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
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">Loading judging information...</p>
          </div>
        ) : (
          <>
            {hackathons.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Hackathon</h2>
                <div className="max-w-md">
                  <select
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={activeHackathon?.id || ''}
                    onChange={(e) => handleHackathonChange(e.target.value)}
                  >
                    {hackathons.map((hackathon) => (
                      <option key={hackathon.id} value={hackathon.id}>
                        {hackathon.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {activeHackathon && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="font-medium text-gray-700">{activeHackathon.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{activeHackathon.description}</p>
                    
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-gray-500">Judging Period: </span>
                        <span className="text-sm font-medium">
                          {formatDate(activeHackathon.judging_start)} - {formatDate(activeHackathon.judging_end)}
                        </span>
                      </div>
                      
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isJudgingActive(activeHackathon) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isJudgingActive(activeHackathon) ? 'Judging Active' : 'Judging Not Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!isJudgingActive(activeHackathon) && activeHackathon && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Judging is not currently active for this hackathon. You can view projects, but scoring will only be available during the judging period:&nbsp;
                      <span className="font-medium">
                        {formatDate(activeHackathon.judging_start)} - {formatDate(activeHackathon.judging_end)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Projects to Judge */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects to Judge</h2>
              
              {projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">All Projects Judged!</h3>
                  <p className="mt-1 text-gray-500">You've completed judging all the submitted projects for this hackathon.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {projects.map((project) => (
                      <li key={project.id} className="hover:bg-gray-50">
                        <div className="block p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-xl font-semibold text-blue-600 mb-1">{project.title}</h3>
                                <div className="ml-2 flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {project.scoredCriteria}/{project.totalCriteria} criteria scored
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">Team:</span> {project.teams?.name}
                              </p>
                              <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                              
                              {project.technologies && project.technologies.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {project.technologies.map((tech: string) => (
                                      <span key={tech} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end mt-4 md:mt-0">
                              {project.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                                  {project.category}
                                </span>
                              )}
                              
                              <div className="flex mt-2 space-x-2">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View Details
                                </Link>
                                <Link
                                  href={`/judging/${project.id}`}
                                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white 
                                    ${isJudgingActive(activeHackathon) 
                                      ? 'bg-blue-600 hover:bg-blue-700' 
                                      : 'bg-gray-400 cursor-not-allowed'}`}
                                  aria-disabled={!isJudgingActive(activeHackathon)}
                                  onClick={e => {
                                    if (!isJudgingActive(activeHackathon)) {
                                      e.preventDefault()
                                    }
                                  }}
                                >
                                  Score Project
                                </Link>
                              </div>
                              
                              {project.submission_date && (
                                <span className="text-xs text-gray-500 mt-2">
                                  Submitted: {new Date(project.submission_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Judged Projects */}
            {judgedProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Judging</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {judgedProjects.map((project) => (
                      <li key={project.id} className="hover:bg-gray-50">
                        <div className="block p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-xl font-semibold text-blue-600 mb-1">{project.title}</h3>
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Scored
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">Team:</span> {project.teams?.name}
                              </p>
                              <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                            </div>
                            
                            <div className="flex flex-col items-end mt-4 md:mt-0">
                              {project.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                                  {project.category}
                                </span>
                              )}
                              
                              <div className="flex mt-2 space-x-2">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View Details
                                </Link>
                                {isJudgingActive(activeHackathon) && (
                                  <Link
                                    href={`/judging/${project.id}`}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                                  >
                                    Edit Scores
                                  </Link>
                                )}
                              </div>
                              
                              {project.submission_date && (
                                <span className="text-xs text-gray-500 mt-2">
                                  Submitted: {new Date(project.submission_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}