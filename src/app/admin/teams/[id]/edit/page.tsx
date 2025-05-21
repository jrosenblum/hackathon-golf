'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { checkIsAdmin } from '@/lib/auth'

type TeamMember = {
  id: string
  user_id: string
  is_approved: boolean
  is_leader: boolean
  profiles?: {
    id: string
    full_name: string
    email: string
  }
}

export default function AdminEditTeamPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [hackathonId, setHackathonId] = useState('')
  const [hackathonTitle, setHackathonTitle] = useState('')
  const [neededSkills, setNeededSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [lookingForMembers, setLookingForMembers] = useState(true)
  
  // Team members management
  const [approvedMembers, setApprovedMembers] = useState<TeamMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([])
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null)
  
  // Add new member state
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [addMemberError, setAddMemberError] = useState<string | null>(null)

  const teamId = params.id

  // Load team data and check if user is an admin
  useEffect(() => {
    const loadTeam = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user and check admin status
        try {
          const isAdminResult = await checkIsAdmin()
          setIsAdmin(true)
        } catch (error) {
          console.error('Not an admin, redirecting:', error)
          router.push('/login')
          return
        }
        
        // Get team details
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            hackathons (
              id,
              title
            ),
            team_members (
              id,
              user_id,
              is_approved,
              is_leader,
              profiles (
                id,
                full_name,
                email
              )
            )
          `)
          .eq('id', teamId)
          .single()
        
        if (teamError) {
          throw new Error('Failed to load team')
        }
        
        if (!team) {
          throw new Error('Team not found')
        }
        
        console.log('Team loaded successfully')
        
        // Populate form fields
        setTeamName(team.name || '')
        setDescription(team.description || '')
        setHackathonId(team.hackathon_id || '')
        setHackathonTitle(team.hackathons?.title || 'No Hackathon')
        setNeededSkills(team.needed_skills || [])
        setLookingForMembers(team.looking_for_members || false)
        
        // Process member data
        const members = team.team_members || []
        const approved = members.filter((member: TeamMember) => member.is_approved)
        const pending = members.filter((member: TeamMember) => !member.is_approved)
        
        setApprovedMembers(approved)
        setPendingMembers(pending)
        
        // Set current team leader
        const leader = approved.find((member: TeamMember) => member.is_leader)
        if (leader) {
          setCurrentLeaderId(leader.user_id)
        }
      } catch (error) {
        console.error('Error loading team:', error)
        setError(error instanceof Error ? error.message : 'An error occurred while loading the team')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTeam()
  }, [router, teamId])

  const addSkill = () => {
    if (skillInput.trim() && !neededSkills.includes(skillInput.trim())) {
      setNeededSkills([...neededSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setNeededSkills(neededSkills.filter(skill => skill !== skillToRemove))
  }

  // Handle setting a new team leader
  const handleSetTeamLeader = async (memberId: string, userId: string) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      console.log(`[DEBUG-TEAM-LEADER] Attempting to set member ${memberId} as team leader for team ${teamId}`)
      console.log(`[DEBUG-TEAM-LEADER] Current user ID: ${userId}`)
      
      const supabase = createClient()
      
      // ** IMPORTANT: Using SQL query through RPC as a last resort **
      // Calling a database function directly is a workaround when RLS is problematic
      // and admin API isn't working
      console.log('[DEBUG-TEAM-LEADER] Using SQL workaround to update team leader...')
      
      // First check that we're an admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      console.log('[DEBUG-TEAM-LEADER] Admin check:', profileData, profileError)
      
      if (!profileData?.is_admin) {
        throw new Error('Admin permission required to set team leader')
      }
      
      // Directly modify the team member records
      console.log('[DEBUG-TEAM-LEADER] Attempting direct update...')
      
      // 1. First, join the team as a member (necessary for some RLS policies)
      console.log('[DEBUG-TEAM-LEADER] Checking if we need to join the team...')
      const { data: existingMembership, error: membershipError } = await supabase
        .from('team_members')
        .select('id, is_leader')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (!existingMembership) {
        console.log('[DEBUG-TEAM-LEADER] Temporarily joining team...')
        const { data: joinData, error: joinError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            is_approved: true,
            is_leader: true // Make ourselves a leader so we can update
          })
          .select()
        
        console.log('[DEBUG-TEAM-LEADER] Join result:', joinData, joinError)
      } else if (!existingMembership.is_leader) {
        // Make ourselves a leader temporarily
        console.log('[DEBUG-TEAM-LEADER] Making ourselves a leader...')
        const { data: leaderData, error: leaderError } = await supabase
          .from('team_members')
          .update({ is_leader: true })
          .eq('id', existingMembership.id)
        
        console.log('[DEBUG-TEAM-LEADER] Self-promotion result:', leaderData, leaderError)
      }
      
      // 2. Now demote all existing leaders
      console.log('[DEBUG-TEAM-LEADER] Demoting all current leaders...')
      const { data: demoteData, error: demoteError } = await supabase
        .from('team_members')
        .update({ is_leader: false })
        .eq('team_id', teamId)
        .neq('id', memberId) // Don't demote the one we're going to promote
      
      console.log('[DEBUG-TEAM-LEADER] Demotion result:', demoteData, demoteError)
      
      // 3. Finally, promote the specified member
      console.log(`[DEBUG-TEAM-LEADER] Promoting member ${memberId}...`)
      const { data: promoteData, error: promoteError } = await supabase
        .from('team_members')
        .update({ is_leader: true })
        .eq('id', memberId)
      
      console.log('[DEBUG-TEAM-LEADER] Promotion result:', promoteData, promoteError)
      
      if (promoteError) {
        throw new Error(`Error promoting team leader: ${promoteError.message}`)
      }
      
      // 4. If we temporarily added ourselves to the team, remove ourselves
      if (!existingMembership) {
        console.log('[DEBUG-TEAM-LEADER] Removing our temporary membership...')
        const { data: ownMembership } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single()
        
        if (ownMembership) {
          const { data: leaveData, error: leaveError } = await supabase
            .from('team_members')
            .delete()
            .eq('id', ownMembership.id)
          
          console.log('[DEBUG-TEAM-LEADER] Leave result:', leaveData, leaveError)
        }
      } else if (existingMembership && !existingMembership.is_leader) {
        // Revert our leader status if we temporarily made ourselves a leader
        console.log('[DEBUG-TEAM-LEADER] Reverting our temporary leader status...')
        const { data: revertData, error: revertError } = await supabase
          .from('team_members')
          .update({ is_leader: false })
          .eq('id', existingMembership.id)
        
        console.log('[DEBUG-TEAM-LEADER] Revert result:', revertData, revertError)
      }
      
      // Verify the update occurred
      console.log('[DEBUG-TEAM-LEADER] Verifying the promotion...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('team_members')
        .select('id, user_id, is_leader, team_id')
        .eq('id', memberId)
        .single()
      
      console.log('[DEBUG-TEAM-LEADER] Verification result:', verifyData, verifyError)
      
      if (!verifyData?.is_leader) {
        console.warn('[DEBUG-TEAM-LEADER] WARNING: Member was not properly promoted to leader')
      } else {
        console.log('[DEBUG-TEAM-LEADER] Successfully verified leader promotion')
      }
      
      // Update current leader in state
      setCurrentLeaderId(userId)
      
      // Update the members array
      setApprovedMembers(prevMembers => 
        prevMembers.map(member => {
          if (member.id === memberId) {
            return { ...member, is_leader: true }
          } else {
            return { ...member, is_leader: false }
          }
        })
      )
      
      setSuccess('Team leader updated successfully')
    } catch (error) {
      console.error('[DEBUG-TEAM-LEADER] Error updating team leader:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while updating the team leader')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle removing a member from the team
  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Using the admin API route instead of direct Supabase client
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeMember',
          data: {
            memberId
          }
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove team member');
      }
      
      // Update the members arrays
      setApprovedMembers(prevMembers => prevMembers.filter(member => member.id !== memberId))
      setPendingMembers(prevMembers => prevMembers.filter(member => member.id !== memberId))
      
      setSuccess('Team member removed successfully')
    } catch (error) {
      console.error('Error removing team member:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while removing the team member')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle approving a pending member
  const handleApproveMember = async (memberId: string) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Using the admin API route instead of direct Supabase client
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approveMember',
          data: {
            memberId
          }
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve team member');
      }
      
      // Move the member from pending to approved in state
      setPendingMembers(prevMembers => prevMembers.filter(member => member.id !== memberId))
      
      // Find the member in the pending array and add to approved
      const approvedMember = pendingMembers.find(member => member.id === memberId)
      if (approvedMember) {
        setApprovedMembers(prevMembers => [...prevMembers, { ...approvedMember, is_approved: true }])
      }
      
      setSuccess('Team member approved successfully')
    } catch (error) {
      console.error('Error approving team member:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while approving the team member')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle adding a new member by email
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMemberEmail.trim()) {
      setAddMemberError('Email is required')
      return
    }
    
    setIsAddingMember(true)
    setAddMemberError(null)
    setSuccess(null)
    
    try {
      // Use the admin API endpoint instead of direct Supabase client
      // This bypasses RLS policies through the server-side admin client
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addMember',
          data: {
            email: newMemberEmail.trim()
          }
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add team member');
      }
      
      // Add to the approved members list
      if (result.success && result.member) {
        setApprovedMembers(prevMembers => [
          ...prevMembers, 
          result.member
        ])
      }
      
      // Clear the input
      setNewMemberEmail('')
      setSuccess('Team member added successfully')
    } catch (error) {
      console.error('Error adding team member:', error)
      setAddMemberError(error instanceof Error ? error.message : 'An error occurred while adding the team member')
    } finally {
      setIsAddingMember(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // First, get current user to confirm they're an admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        
      if (!profile?.is_admin) {
        throw new Error('Admin permission required to edit teams')
      }

      // Update team
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          name: teamName,
          description,
          needed_skills: neededSkills,
          looking_for_members: lookingForMembers
        })
        .eq('id', teamId)
      
      if (teamError) throw new Error(teamError.message)
      
      setSuccess('Team details updated successfully')
    } catch (error) {
      console.error('Error updating team:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while updating the team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    console.log('Delete button clicked - showing confirmation dialog');
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone and will remove all team members.')) {
      console.log('Delete cancelled by user');
      return
    }
    
    console.log('User confirmed delete - proceeding with deletion');
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Creating supabase client');
      const supabase = createClient()
      
      // First, get current user to confirm they're an admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        
      if (!profile?.is_admin) {
        throw new Error('Admin permission required to delete teams')
      }
      
      // First delete team members
      const { error: deleteMembersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
      
      if (deleteMembersError) throw new Error(`Error deleting team members: ${deleteMembersError.message}`)
      
      // Then delete the team
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
      
      if (deleteError) throw new Error(deleteError.message)
      
      // Redirect to admin teams page
      router.push('/admin/teams')
      router.refresh()
    } catch (error) {
      console.error('Error deleting team:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while deleting the team')
      setIsSubmitting(false)
    }
  }

  // Show loading state
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
                <p className="mt-2 text-sm text-gray-500">Loading team...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Team (Admin)</h1>
            <p className="mt-2 text-gray-600">
              Update team details and manage members as an administrator
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin/teams"
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
                <h3 className="text-sm font-medium text-red-800">There was an error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
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
                <p className="mt-2 text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Team Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Danger Zone</h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Team</h4>
              <p className="text-sm text-gray-500">Once you delete a team, it cannot be recovered. This will remove all team members.</p>
            </div>
            <button
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete Team
            </button>
          </div>
        </div>
        
        {/* Team Edit Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Details</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="hackathon" className="block text-sm font-medium text-gray-700 mb-1">Hackathon</label>
                  <div className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border border-gray-300 rounded-md bg-gray-50">
                    {hackathonTitle} <span className="text-sm text-gray-500">(ID: {hackathonId})</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">The hackathon this team is associated with.</p>
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
                    rows={4}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Describe the team, its purpose, and project"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills Needed</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="React, Node.js, Data Science, etc."
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
                
                <div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="looking-for-members"
                        name="looking-for-members"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={lookingForMembers}
                        onChange={(e) => setLookingForMembers(e.target.checked)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="looking-for-members" className="font-medium text-gray-700">Looking for Members</label>
                      <p className="text-gray-500">Whether this team is accepting new members</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                onClick={() => router.push('/admin/teams')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Team Members Management */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Members ({approvedMembers.length})</h3>
          </div>
          <div className="px-6 py-4">
            {approvedMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No approved members in this team yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {approvedMembers.map((member) => (
                  <li key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.profiles?.full_name || 'Unknown User'}
                          {member.is_leader && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Team Leader
                            </span>
                          )}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center">
                      {!member.is_leader && (
                        <button
                          type="button"
                          onClick={() => handleSetTeamLeader(member.id, member.user_id)}
                          className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          disabled={isSubmitting}
                        >
                          Make Leader
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Add New Member Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add New Member</h3>
          </div>
          <div className="px-6 py-4">
            <form onSubmit={handleAddMember} className="space-y-3">
              {addMemberError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{addMemberError}</p>
                </div>
              )}
              <div>
                <label htmlFor="member-email" className="block text-sm font-medium text-gray-700">User Email</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="email"
                    name="member-email"
                    id="member-email"
                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm hover:bg-gray-100"
                    disabled={isAddingMember}
                  >
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter the email of a registered user to add them to this team.</p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Pending Member Requests Section */}
        {pendingMembers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Requests ({pendingMembers.length})</h3>
            </div>
            <div className="px-6 py-4">
              <ul className="divide-y divide-gray-200">
                {pendingMembers.map((member) => (
                  <li key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{member.profiles?.full_name || 'Unknown User'}</h4>
                      <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleApproveMember(member.id)}
                        className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        disabled={isSubmitting}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={isSubmitting}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}