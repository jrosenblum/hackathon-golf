'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function JudgeProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [project, setProject] = useState<any>(null)
  const [criteria, setCriteria] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')
  const [judgeId, setJudgeId] = useState<string | null>(null)
  const [hackathonId, setHackathonId] = useState<string | null>(null)
  
  // Load project and judging criteria
  useEffect(() => {
    const fetchProjectAndCriteria = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
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
              id,
              name,
              description,
              hackathon_id
            )
          `)
          .eq('id', projectId)
          .single()
        
        if (projectError) {
          console.error('Error fetching project:', projectError)
          setError('Error fetching project details')
          setIsLoading(false)
          return
        }
        
        if (!projectData) {
          setError('Project not found')
          setIsLoading(false)
          return
        }
        
        setProject(projectData)
        const hackathonId = projectData.teams.hackathon_id
        setHackathonId(hackathonId)
        
        // Check if user is a judge for this hackathon
        const { data: judgeData, error: judgeError } = await supabase
          .from('judges')
          .select('id')
          .eq('user_id', user.id)
          .eq('hackathon_id', hackathonId)
          .single()
        
        if (judgeError) {
          console.error('Error checking judge status:', judgeError)
          setError('You are not authorized to judge this project')
          setIsLoading(false)
          return
        }
        
        setJudgeId(judgeData.id)
        
        // Fetch judging criteria for this hackathon
        const { data: criteriaData, error: criteriaError } = await supabase
          .from('judging_criteria')
          .select('*')
          .eq('hackathon_id', hackathonId)
          .order('weight', { ascending: false })
        
        if (criteriaError) {
          console.error('Error fetching judging criteria:', criteriaError)
          setError('Error fetching judging criteria')
          setIsLoading(false)
          return
        }
        
        setCriteria(criteriaData || [])
        
        // Fetch existing scores if any
        const { data: scoresData, error: scoresError } = await supabase
          .from('project_scores')
          .select('criteria_id, score, feedback')
          .eq('project_id', projectId)
          .eq('judge_id', judgeData.id)
        
        if (scoresError) {
          console.error('Error fetching existing scores:', scoresError)
        } else if (scoresData && scoresData.length > 0) {
          // Initialize scores from existing data
          const scoreMap: Record<string, number> = {}
          scoresData.forEach(score => {
            scoreMap[score.criteria_id] = score.score
            
            // Set feedback if it exists
            if (score.feedback) {
              setFeedback(score.feedback)
            }
          })
          setScores(scoreMap)
        }
        
      } catch (err) {
        console.error('Error loading project and criteria:', err)
        setError('An error occurred while loading the project')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjectAndCriteria()
  }, [projectId, router])
  
  // Handle score change
  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: score
    }))
  }
  
  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value)
  }
  
  // Submit scores
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!judgeId || !project) {
      setError('Unable to submit scores: missing judge or project information')
      return
    }
    
    const missingScores = criteria.some(criterion => 
      scores[criterion.id] === undefined || scores[criterion.id] === null
    )
    
    if (missingScores) {
      if (!confirm('Some criteria have not been scored. Do you want to save your partial scoring?')) {
        return
      }
    }
    
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)
      
      const supabase = createClient()
      
      // Prepare scores for submission
      const scoresToSubmit = criteria.map(criterion => {
        const score = scores[criterion.id] !== undefined ? scores[criterion.id] : null
        return {
          project_id: projectId,
          judge_id: judgeId,
          criteria_id: criterion.id,
          score,
          feedback: feedback || null
        }
      }).filter(score => score.score !== null)
      
      if (scoresToSubmit.length === 0) {
        setError('Please score at least one criterion before saving')
        setIsSaving(false)
        return
      }
      
      // Check if scores already exist
      const { data: existingScores, error: checkError } = await supabase
        .from('project_scores')
        .select('id, criteria_id')
        .eq('project_id', projectId)
        .eq('judge_id', judgeId)
      
      if (checkError) {
        console.error('Error checking existing scores:', checkError)
        setError('Error checking existing scores')
        setIsSaving(false)
        return
      }
      
      // Build a map of existing scores by criteria_id
      const existingScoreMap: Record<string, string> = {}
      existingScores?.forEach(score => {
        existingScoreMap[score.criteria_id] = score.id
      })
      
      // Separate scores to update and insert
      const scoresToUpdate: any[] = []
      const scoresToInsert: any[] = []
      
      scoresToSubmit.forEach(score => {
        if (existingScoreMap[score.criteria_id]) {
          // Score exists, update it
          scoresToUpdate.push({
            id: existingScoreMap[score.criteria_id],
            score: score.score,
            feedback: score.feedback
          })
        } else {
          // New score, insert it
          scoresToInsert.push(score)
        }
      })
      
      // Update existing scores
      if (scoresToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('project_scores')
          .upsert(scoresToUpdate)
        
        if (updateError) {
          console.error('Error updating scores:', updateError)
          setError('Error updating scores')
          setIsSaving(false)
          return
        }
      }
      
      // Insert new scores
      if (scoresToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('project_scores')
          .insert(scoresToInsert)
        
        if (insertError) {
          console.error('Error saving scores:', insertError)
          setError('Error saving scores')
          setIsSaving(false)
          return
        }
      }
      
      // If there are other scores that have feedback but weren't included in the scoresToSubmit,
      // update their feedback
      if (feedback) {
        const unsubmittedCriteriaIds = Object.keys(existingScoreMap).filter(
          criteriaId => !scoresToSubmit.some(score => score.criteria_id === criteriaId)
        )
        
        if (unsubmittedCriteriaIds.length > 0) {
          const feedbackUpdates = unsubmittedCriteriaIds.map(criteriaId => ({
            id: existingScoreMap[criteriaId],
            feedback
          }))
          
          const { error: feedbackError } = await supabase
            .from('project_scores')
            .upsert(feedbackUpdates)
          
          if (feedbackError) {
            console.error('Error updating feedback:', feedbackError)
          }
        }
      }
      
      setSuccess('Scores saved successfully')
      
      // Optionally navigate back to the judging dashboard after a delay
      setTimeout(() => {
        router.push('/judging')
      }, 1500)
      
    } catch (err) {
      console.error('Error saving scores:', err)
      setError('An error occurred while saving scores')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Render star rating component
  const StarRating = ({ 
    maxScore, 
    value, 
    onChange 
  }: { 
    maxScore: number, 
    value: number | undefined, 
    onChange: (score: number) => void 
  }) => {
    const stars = []
    const normalizedMax = Math.min(maxScore, 10) // Cap at 10 stars for UI purposes
    
    for (let i = 1; i <= normalizedMax; i++) {
      const isActive = value !== undefined && i <= value
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`h-6 w-6 ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </button>
      )
    }
    
    return (
      <div className="flex items-center">
        {stars}
        {value !== undefined && (
          <span className="ml-2 text-gray-600 text-sm">{value}/{maxScore}</span>
        )}
      </div>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judge Project</h1>
            <p className="mt-2 text-gray-600">
              Score this project based on the judging criteria
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/judging"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Judging Panel
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
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="rounded-lg bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
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
            <p className="mt-2 text-sm text-gray-500">Loading project details...</p>
          </div>
        ) : (
          <>
            {project && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Submitted by {project.teams?.name}
                  </p>
                </div>
                
                <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Category</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {project.category || 'Not specified'}
                      </p>
                    </div>
                    
                    {project.submission_date && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(project.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Technologies</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.technologies.map((tech: string) => (
                        <span 
                          key={tech}
                          className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                  <div className="mt-2 space-y-2">
                    {project.video_url ? (
                      <div>
                        <a 
                          href={project.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          View Demo Video
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No demo video provided</p>
                    )}
                    
                    {project.resources_url && (
                      <div>
                        <a 
                          href={project.resources_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          View Code Repository
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {criteria.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Scoring Criteria</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Score each criterion based on the project's performance
                  </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-5">
                    <div className="space-y-8">
                      {criteria.map((criterion) => (
                        <div key={criterion.id} className="border-b border-gray-100 pb-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{criterion.name}</h3>
                              <p className="text-sm text-gray-500">{criterion.description}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Weight: {criterion.weight}
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <StarRating
                              maxScore={criterion.max_score}
                              value={scores[criterion.id]}
                              onChange={(score) => handleScoreChange(criterion.id, score)}
                            />
                          </div>
                        </div>
                      ))}
                      
                      <div>
                        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (Optional)
                        </label>
                        <textarea
                          id="feedback"
                          name="feedback"
                          rows={4}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Provide any additional feedback or comments about this project"
                          value={feedback}
                          onChange={handleFeedbackChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 flex justify-end">
                    <Link
                      href="/judging"
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Scores'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}