'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

export default function TeamDetailPage() {
  // Get the id directly using useParams hook instead
  const params = useParams()
  const teamId = params.id as string
  const router = useRouter()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userIsMember, setUserIsMember] = useState(false)
  const [userHasRequested, setUserHasRequested] = useState(false)
  const [joinRequestSubmitting, setJoinRequestSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)
        }
        
        // Get team details
        const { data, error: teamError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            description,
            needed_skills,
            looking_for_members,
            created_at,
            hackathon_id,
            hackathons (
              id,
              title,
              is_active
            )
          `)
          .eq('id', teamId)
          .single()
          
        if (teamError) {
          throw new Error(teamError.message)
        }
        
        if (!data) {
          throw new Error('Team not found')
        }
        
        setTeam(data)
        
        // Get team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id,
            user_id,
            is_leader,
            is_approved,
            profiles (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('team_id', teamId)
          
        if (membersError) throw new Error(membersError.message)
        
        // Check if current user is a member or has requested to join
        if (user) {
          const isMember = membersData?.some(m => 
            m.user_id === user.id && m.is_approved
          )
          setUserIsMember(!!isMember)
          
          const hasRequested = membersData?.some(m => 
            m.user_id === user.id && !m.is_approved
          )
          setUserHasRequested(!!hasRequested)
        }
        
        setMembers(membersData || [])
        
        // Get team's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, description, category, technologies, submission_date')
          .eq('team_id', teamId)
          .order('submission_date', { ascending: false })
          
        if (projectsError) throw new Error(projectsError.message)
        
        setProjects(projectsData || [])
      } catch (err) {
        console.error('Error fetching team data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamData()
  }, [teamId])

  const handleJoinRequest = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    try {
      setJoinRequestSubmitting(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: currentUser.id,
          is_leader: false,
          is_approved: false
        })
        
      if (error) throw new Error(error.message)
      
      setUserHasRequested(true)
    } catch (err) {
      console.error('Error sending join request:', err)
      setError(err instanceof Error ? err.message : 'Failed to send join request')
    } finally {
      setJoinRequestSubmitting(false)
    }
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

  if (error || !team) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-gray-500">{error || 'Team not found'}</p>
          <div className="mt-6">
            <Link
              href="/teams"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const approvedMembers = members.filter(m => m.is_approved)
  const pendingMembers = members.filter(m => !m.is_approved)
  const teamLeaders = approvedMembers.filter(m => m.is_leader)
  const formattedJoinDate = team.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown'
  const isActiveHackathon = team.hackathons?.is_active

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="mt-2 text-gray-600">
            {isActiveHackathon ? 'Participating in active hackathon' : 'Part of a previous hackathon'}
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

      {/* Status for join requests */}
      {userHasRequested && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your request to join this team is pending approval by a team leader.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Team info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">Team Information</h2>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap mb-6">{team.description}</p>
              
              {team.needed_skills && team.needed_skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Skills Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {team.needed_skills.map((skill: string) => (
                      <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created on {formattedJoinDate}</span>
                <span>
                  {team.looking_for_members 
                    ? 'Open to new members' 
                    : 'Not looking for members'}
                </span>
              </div>
            </div>
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {projects.map((project: any) => (
                  <li key={project.id} className="hover:bg-gray-50">
                    <Link href={`/projects/${project.id}`} className="block px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-blue-600">{project.title}</h3>
                          <p className="mt-1 text-gray-600 line-clamp-2">{project.description}</p>
                          
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.technologies.map((tech: string) => (
                                <span key={tech} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end">
                          {project.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                              {project.category}
                            </span>
                          )}
                          {project.submission_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(project.submission_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          {/* Join team */}
          {!userIsMember && !userHasRequested && team.looking_for_members && isActiveHackathon && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">Join this Team</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Interested in joining this team? Send a request to the team leader.
                </p>
                <button
                  onClick={handleJoinRequest}
                  disabled={joinRequestSubmitting}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {joinRequestSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Request...
                    </>
                  ) : 'Request to Join'}
                </button>
              </div>
            </div>
          )}

          {/* Team members */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Team Members ({approvedMembers.length})</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {approvedMembers.map((member: any) => (
                <li key={member.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.profiles?.avatar_url ? (
                        <img 
                          src={member.profiles.avatar_url}
                          alt={member.profiles.full_name}
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
                        {member.profiles?.full_name || 'Unknown User'}
                        {member.is_leader && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Team Leader
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                    </div>
                  </div>
                </li>
              ))}

              {approvedMembers.length === 0 && (
                <li className="px-6 py-4 text-center text-gray-500">
                  No approved members found
                </li>
              )}
            </ul>
          </div>

          {/* Pending members - Only shown to team leaders */}
          {userIsMember && teamLeaders.some(leader => leader.user_id === currentUser?.id) && pendingMembers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-gray-900">Pending Requests ({pendingMembers.length})</h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {pendingMembers.map((member: any) => (
                  <li key={member.id} className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.profiles?.avatar_url ? (
                          <img 
                            src={member.profiles.avatar_url}
                            alt={member.profiles.full_name}
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
                          {member.profiles?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}