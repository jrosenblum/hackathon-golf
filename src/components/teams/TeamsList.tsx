'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Define proper types for team and error state
type Team = {
  id: string
  name: string
  description: string
  needed_skills: string[]
  looking_for_members: boolean
  team_members: TeamMember[]
}

type TeamMember = {
  id: string
  user_id: string
  team_id: string
  is_approved: boolean
  is_leader: boolean
}

type ErrorState = {
  message: string
  code?: string
  isVisible: boolean
}

export default function TeamsList({ teams }: { teams: Team[] }) {
  const [pendingTeamIds, setPendingTeamIds] = useState<string[]>([])
  const [memberTeamIds, setMemberTeamIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)
  
  // Function to dismiss error messages
  const dismissError = () => {
    setError(null)
  }
  
  useEffect(() => {
    const fetchUserTeamStatus = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw new Error(`Authentication error: ${userError.message}`)
        }
        
        if (!user) {
          setIsLoading(false)
          return
        }
        
        // Get all pending team requests for the current user
        const { data: pendingRequests, error: pendingError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('is_approved', false)
          
        if (pendingError) {
          throw new Error(`Error fetching pending requests: ${pendingError.message}`)
        }
        
        // Get all teams where the user is an approved member
        const { data: approvedTeams, error: approvedError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('is_approved', true)
          
        if (approvedError) {
          throw new Error(`Error fetching approved teams: ${approvedError.message}`)
        }
        
        // Extract team IDs into arrays
        const pendingIds = pendingRequests?.map(request => request.team_id) || []
        const memberIds = approvedTeams?.map(team => team.team_id) || []
        
        setPendingTeamIds(pendingIds)
        setMemberTeamIds(memberIds)
      } catch (error) {
        console.error('Error fetching user team status:', error)
        setError({
          message: error instanceof Error ? error.message : 'Failed to load your team information',
          isVisible: true
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserTeamStatus()
  }, [])
  
  // Display error message if there's an error
  if (error && error.isVisible) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6" data-testid="teams-error-message">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading teams</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={dismissError}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display loading indicator when data is being fetched
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center" data-testid="teams-loading">
        <svg className="animate-spin mx-auto h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Loading teams...</h3>
      </div>
    );
  }
  
  // Display empty state when no teams are available
  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center" data-testid="no-teams-available">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No teams available</h3>
        <p className="mt-1 text-gray-500">Be the first to create a team for the hackathon.</p>
        <div className="mt-6">
          <Link
            href="/teams/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            data-testid="create-team-button"
          >
            Create a Team
          </Link>
        </div>
      </div>
    )
  }
  
  // Display the team list when data is loaded successfully
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" data-testid="teams-list-container">
      <ul className="divide-y divide-gray-200">
        {teams.map((team) => {
          // Make sure team_members is an array before filtering
          const teamMembers = Array.isArray(team.team_members) ? team.team_members : [];
          const memberCount = teamMembers.filter((m) => m.is_approved).length || 0
          const isPendingRequest = pendingTeamIds.includes(team.id)
          const isUserMember = memberTeamIds.includes(team.id)
          
          // Set appropriate background based on status
          let bgClass = "hover:bg-gray-50"
          if (isUserMember) bgClass = "bg-green-50 hover:bg-green-100"
          else if (isPendingRequest) bgClass = "bg-yellow-50 hover:bg-yellow-100"
          
          return (
            <li key={team.id} className={bgClass} data-testid={`team-${team.id}`}>
              <Link href={`/teams/${team.id}`} className="block p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold text-blue-600 mb-1">{team.name}</h2>
                      {isUserMember && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" data-testid="your-team-badge">
                          Your Team
                        </span>
                      )}
                      {isPendingRequest && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" data-testid="pending-request-badge">
                          Request Pending
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{team.description}</p>
                    
                    {team.needed_skills && team.needed_skills.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 mr-2">Skills needed:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.needed_skills.map((skill) => (
                            <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end mt-4 md:mt-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                    {isUserMember && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        You are a member
                      </span>
                    )}
                    {team.looking_for_members && !isPendingRequest && !isUserMember && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Looking for members
                      </span>
                    )}
                    {isPendingRequest && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" data-testid="awaiting-approval-badge">
                        Awaiting approval
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}