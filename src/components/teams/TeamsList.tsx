'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function TeamsList({ teams }: { teams: any[] }) {
  const [pendingTeamIds, setPendingTeamIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }
        
        // Get all pending team requests for the current user
        const { data: pendingRequests } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('is_approved', false)
        
        // Extract team IDs into an array
        const pendingIds = pendingRequests?.map(request => request.team_id) || []
        setPendingTeamIds(pendingIds)
      } catch (error) {
        console.error('Error fetching pending team requests:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPendingRequests()
  }, [])
  
  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No teams available</h3>
        <p className="mt-1 text-gray-500">Be the first to create a team for the hackathon.</p>
        <div className="mt-6">
          <Link
            href="/teams/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create a Team
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {teams.map((team: any) => {
          const memberCount = team.team_members?.filter((m: any) => m.is_approved).length || 0
          const isPendingRequest = pendingTeamIds.includes(team.id)
          
          return (
            <li key={team.id} className={`hover:bg-gray-50 ${isPendingRequest ? 'bg-yellow-50 team-pending-request' : ''}`} data-testid={`team-${team.id}`}>
              <Link href={`/teams/${team.id}`} className="block p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold text-blue-600 mb-1">{team.name}</h2>
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
                          {team.needed_skills.map((skill: string) => (
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
                    {team.looking_for_members && !isPendingRequest && (
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