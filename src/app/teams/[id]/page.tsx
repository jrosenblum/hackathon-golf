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
  const [leaveTeamSubmitting, setLeaveTeamSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserMemberId, setCurrentUserMemberId] = useState<string | null>(null)
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
          const userMember = membersData?.find(m => 
            m.user_id === user.id && m.is_approved
          )
          setUserIsMember(!!userMember)
          
          if (userMember) {
            setCurrentUserMemberId(userMember.id)
          }
          
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
      setError(null)
      const supabase = createClient()
      
      // First check if the user is already on a team in this hackathon
      const { data: hackathonId } = await supabase
        .from('teams')
        .select('hackathon_id')
        .eq('id', teamId)
        .single()
      
      if (hackathonId) {
        // Check if the user is already on a team in this hackathon
        const { data: existingTeams } = await supabase
          .from('team_members')
          .select(`
            id,
            is_approved,
            teams!inner(
              id,
              name,
              hackathon_id
            )
          `)
          .eq('user_id', currentUser.id)
          .eq('teams.hackathon_id', hackathonId.hackathon_id)
          .eq('is_approved', true)
        
        if (existingTeams && existingTeams.length > 0) {
          const teamName = existingTeams[0].teams.name
          throw new Error(`You're already a member of team "${teamName}" in this hackathon. You can only be on one team per hackathon.`)
        }
      }
      
      // Proceed with joining the team
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: currentUser.id,
          is_leader: false,
          is_approved: false
        })
        
      if (error) {
        // Handle RLS policy violation with a more specific message
        if (error.message.includes('violates row-level security policy')) {
          throw new Error('You cannot join this team because you are already a member of another team in this hackathon.')
        }
        throw new Error(error.message)
      }
      
      setUserHasRequested(true)
    } catch (err) {
      console.error('Error sending join request:', err)
      setError(err instanceof Error ? err.message : 'Failed to send join request')
    } finally {
      setJoinRequestSubmitting(false)
    }
  }
  
  // New function to handle approval of team join requests
  const handleApproveRequest = async (memberId: string) => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Update the team member record to approved status
      const { error } = await supabase
        .from('team_members')
        .update({ is_approved: true })
        .eq('id', memberId)
        
      if (error) throw new Error(error.message)
      
      // Update the local state to reflect the change
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === memberId 
            ? { ...member, is_approved: true } 
            : member
        )
      )
      
    } catch (err) {
      console.error('Error approving team member:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve team member')
    } finally {
      setIsLoading(false)
    }
  }
  
  // New function to handle rejection of team join requests
  const handleRejectRequest = async (memberId: string) => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Delete the team member record
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        
      if (error) throw new Error(error.message)
      
      // Update the local state to remove the rejected member
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberId)
      )
      
    } catch (err) {
      console.error('Error rejecting team member:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject team member')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to handle leaving a team
  const handleLeaveTeam = async () => {
    if (!currentUser || !currentUserMemberId) return
    
    try {
      setLeaveTeamSubmitting(true)
      setError(null)
      const supabase = createClient()
      
      // Check if this user is the last team leader
      const teamLeaders = members.filter(m => m.is_leader && m.is_approved)
      const isLastLeader = teamLeaders.length === 1 && teamLeaders[0].user_id === currentUser.id
      
      if (isLastLeader) {
        // Check if there are other team members
        const otherMembers = members.filter(m => m.user_id !== currentUser.id && m.is_approved)
        
        if (otherMembers.length > 0) {
          setError("As the last team leader, you cannot leave the team while other members remain. Please assign a new leader or remove other members first.")
          return
        }
      }
      
      // Delete the team member record
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', currentUserMemberId)
        
      if (error) throw new Error(error.message)
      
      // Update UI state
      setUserIsMember(false)
      setCurrentUserMemberId(null)
      
      // Remove the user from the members list
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== currentUserMemberId)
      )
      
      // If they were the last member and we want to auto-delete empty teams:
      // const remainingMembers = members.filter(m => m.id !== currentUserMemberId)
      // if (remainingMembers.length === 0) {
      //   router.push('/teams')
      // }
      
    } catch (err) {
      console.error('Error leaving team:', err)
      setError(err instanceof Error ? err.message : 'Failed to leave team')
    } finally {
      setLeaveTeamSubmitting(false)
    }
  }
  
  // Function to assign team leadership
  const handleAssignLeader = async (memberId: string) => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      
      // Get the team ID from the member being promoted
      const memberToPromote = members.find(m => m.id === memberId)
      if (!memberToPromote) throw new Error("Member not found")
      
      console.log('Assigning new team leader', {
        currentUser: currentUser.id,
        memberToPromote: memberToPromote.user_id,
        teamId,
      })

      // First, demote ALL existing team leaders for this team
      const { error: demoteError } = await supabase
        .from('team_members')
        .update({ is_leader: false })
        .eq('team_id', teamId)
        .eq('is_leader', true)
      
      if (demoteError) {
        console.error('Error demoting existing leaders:', demoteError)
        throw new Error('Failed to update team leadership: ' + demoteError.message)
      }
      
      console.log('Demoted all existing team leaders')
      
      // Then, promote the new leader
      const { error: promoteError } = await supabase
        .from('team_members')
        .update({ is_leader: true })
        .eq('id', memberId)
        
      if (promoteError) {
        console.error('Error promoting new leader:', promoteError)
        throw new Error('Failed to promote new leader: ' + promoteError.message)
      }
      
      console.log('Promoted new team leader')
      
      // Update the local state to reflect both changes
      setMembers(prevMembers => 
        prevMembers.map(member => {
          if (member.id === memberId) {
            // Promote the selected member
            return { ...member, is_leader: true }
          } else {
            // Demote all other members
            return { ...member, is_leader: false }
          }
        })
      )
      
    } catch (err) {
      console.error('Error assigning team leader:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign team leader role')
    } finally {
      setIsLoading(false)
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
        <div className="mt-4 md:mt-0 flex space-x-3">
          {/* Show Edit button only to team leaders */}
          {userIsMember && members.some(m => 
            m.user_id === currentUser?.id && m.is_leader && m.is_approved
          ) && (
            <Link
              href={`/teams/${teamId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Team
            </Link>
          )}
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
                {team.looking_for_members ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Open to new members
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not looking for members
                  </span>
                )}
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
            <div className="border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Team Members ({approvedMembers.length})</h2>
              {userIsMember && (
                <button
                  onClick={handleLeaveTeam}
                  disabled={leaveTeamSubmitting}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {leaveTeamSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-2 h-3 w-3 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Leaving...
                    </>
                  ) : 'Leave Team'}
                </button>
              )}
            </div>
            <ul className="divide-y divide-gray-200">
              {approvedMembers.map((member: any) => {
                // Check if current user is a team leader
                const isCurrentUserLeader = userIsMember && members.some(m => 
                  m.user_id === currentUser?.id && m.is_leader && m.is_approved
                );
                
                // Only show assign leader button if:
                // 1. Current user is a leader
                // 2. This member is not already a leader
                // 3. This member is not the current user
                const showAssignLeaderButton = isCurrentUserLeader 
                  && !member.is_leader 
                  && member.user_id !== currentUser?.id;
                  
                return (
                  <li key={member.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
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
                            {member.user_id === currentUser?.id && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                You
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                        </div>
                      </div>
                      
                      {showAssignLeaderButton && (
                        <button
                          type="button"
                          onClick={() => handleAssignLeader(member.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Assign as Leader
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}

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
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {member.profiles?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(member.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(member.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
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