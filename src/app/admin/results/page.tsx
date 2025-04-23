'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { calculateProjectScores, ProjectScore } from '@/lib/judging'

export default function HackathonResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hackathons, setHackathons] = useState<any[]>([])
  const [selectedHackathon, setSelectedHackathon] = useState<string | null>(null)
  const [projectScores, setProjectScores] = useState<ProjectScore[]>([])
  const [filterIncomplete, setFilterIncomplete] = useState(true)
  const [minJudgeCount, setMinJudgeCount] = useState(1)
  
  // Fetch hackathons
  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('hackathons')
          .select('id, title, judging_end, is_active')
          .order('judging_end', { ascending: false })
        
        if (error) {
          throw error
        }
        
        // Separate active and past hackathons
        const now = new Date()
        const pastHackathons = data.filter((h) => new Date(h.judging_end) < now || !h.is_active)
        const activeHackathons = data.filter((h) => new Date(h.judging_end) >= now && h.is_active)
        
        // Sort and combine, with active first
        const sortedHackathons = [
          ...activeHackathons.sort((a, b) => 
            new Date(b.judging_end).getTime() - new Date(a.judging_end).getTime()
          ),
          ...pastHackathons.sort((a, b) => 
            new Date(b.judging_end).getTime() - new Date(a.judging_end).getTime()
          )
        ]
        
        setHackathons(sortedHackathons)
        
        // Set the first hackathon as selected by default
        if (sortedHackathons.length > 0) {
          setSelectedHackathon(sortedHackathons[0].id)
          loadResults(sortedHackathons[0].id)
        }
      } catch (err) {
        console.error('Error fetching hackathons:', err)
        setError('Failed to load hackathons')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchHackathons()
  }, [])
  
  // Load results for a selected hackathon
  const loadResults = async (hackathonId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      
      // Calculate project scores with our utility function
      const scores = await calculateProjectScores(supabase, hackathonId)
      setProjectScores(scores)
    } catch (err) {
      console.error('Error loading results:', err)
      setError('Failed to load hackathon results')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle hackathon selection change
  const handleHackathonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hackathonId = e.target.value
    setSelectedHackathon(hackathonId)
    loadResults(hackathonId)
  }
  
  // Filter projects based on minimum judge count
  const filteredProjects = projectScores.filter(project => {
    if (filterIncomplete && project.judgeCount < minJudgeCount) {
      return false
    }
    return true
  })
  
  // Format a score to display with 2 decimal places
  const formatScore = (score: number) => {
    return score.toFixed(2)
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hackathon Results</h1>
            <p className="mt-2 text-gray-600">
              View judging scores and results for hackathons
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
        
        {hackathons.length === 0 && !isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Hackathons Found</h3>
            <p className="mt-1 text-gray-500">Create hackathons to view their results here.</p>
          </div>
        ) : (
          <>
            {/* Hackathon selector */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <label htmlFor="hackathon-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Hackathon
                  </label>
                  <select
                    id="hackathon-select"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={selectedHackathon || ''}
                    onChange={handleHackathonChange}
                    disabled={isLoading}
                  >
                    {hackathons.map((hackathon) => (
                      <option key={hackathon.id} value={hackathon.id}>
                        {hackathon.title}
                        {hackathon.is_active ? ' (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="filter-incomplete"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filterIncomplete}
                      onChange={() => setFilterIncomplete(!filterIncomplete)}
                    />
                    <label htmlFor="filter-incomplete" className="ml-2 block text-sm text-gray-700">
                      Filter projects with fewer judges
                    </label>
                  </div>
                  
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={minJudgeCount}
                      onChange={(e) => setMinJudgeCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results section */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">Loading results...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Results Available</h3>
                <p className="mt-1 text-gray-500">
                  {projectScores.length === 0 
                    ? "No projects have been scored yet for this hackathon."
                    : "All projects have fewer than the minimum number of judges required."
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Hackathon Results</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Projects are ranked by their weighted score
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weighted Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Judge Count
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.map((project, index) => (
                        <tr key={project.projectId} className={index < 3 ? "bg-yellow-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {index === 0 && (
                                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-800">
                                  🥇
                                </span>
                              )}
                              {index === 1 && (
                                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-800">
                                  🥈
                                </span>
                              )}
                              {index === 2 && (
                                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-50 text-yellow-700">
                                  🥉
                                </span>
                              )}
                              {index > 2 && (
                                <span className="text-gray-900">{index + 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {project.projectTitle}
                            </div>
                            <div className="text-sm text-gray-500">
                              <Link href={`/projects/${project.projectId}`} className="text-blue-600 hover:underline">
                                View Project
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{project.teamName}</div>
                            <div className="text-sm text-gray-500">
                              <Link href={`/teams/${project.teamId}`} className="text-blue-600 hover:underline">
                                View Team
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium
                              ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                index === 1 ? 'bg-gray-100 text-gray-800' : 
                                index === 2 ? 'bg-yellow-50 text-yellow-700' : 
                                'bg-blue-100 text-blue-800'}`}>
                              {formatScore(project.weightedScore)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-500">
                            {formatScore(project.averageScore)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${project.judgeCount < 2 ? 'bg-red-100 text-red-800' : 
                                project.judgeCount < 3 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {project.judgeCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                const el = document.getElementById(`criteria-${project.projectId}`)
                                if (el) {
                                  el.classList.toggle('hidden')
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Detailed Scoring for each project */}
            {!isLoading && filteredProjects.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Scoring Breakdown</h2>
                
                <div className="space-y-6">
                  {filteredProjects.map((project) => (
                    <div key={`criteria-${project.projectId}`} id={`criteria-${project.projectId}`} className="bg-white rounded-lg shadow-md overflow-hidden hidden">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium leading-6 text-gray-900">{project.projectTitle}</h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Team: {project.teamName} | Judge Count: {project.judgeCount}
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                            Overall Score: {formatScore(project.weightedScore)}
                          </span>
                        </div>
                      </div>
                      
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Criteria
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Average Score
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weighted Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(project.criteriaScores).map(([criteriaId, criteria]) => (
                            <tr key={criteriaId}>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{criteria.name}</div>
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">
                                {criteria.weight}
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">
                                {formatScore(criteria.averageScore)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                                  {formatScore(criteria.weightedScore)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}