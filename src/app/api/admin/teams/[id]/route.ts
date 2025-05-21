import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the same auth pattern as other server components
    const supabase = createServerComponentClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the user is an admin in our database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      )
    }
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { action, data } = body
    const teamId = params.id

    // Only proceed with the admin client if the user is authenticated and verified as admin
    const adminClient = createAdminClient()

    // Handle different team admin actions
    switch (action) {
      case 'setTeamLeader':
        if (!data.memberId) {
          return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        // First, demote ALL existing team leaders for this team
        const { error: demoteError } = await adminClient
          .from('team_members')
          .update({ is_leader: false })
          .eq('team_id', teamId)
          .eq('is_leader', true)

        if (demoteError) {
          console.error('Error removing current leader:', demoteError)
          return NextResponse.json({ error: 'Failed to remove current leader' }, { status: 500 })
        }

        // Then, promote the new leader
        const { error: promoteError } = await adminClient
          .from('team_members')
          .update({ is_leader: true })
          .eq('id', data.memberId)

        if (promoteError) {
          console.error('Error setting new leader:', promoteError)
          return NextResponse.json({ error: 'Failed to set new leader' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case 'removeMember':
        if (!data.memberId) {
          return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        // Delete the team membership
        const { error: deleteError } = await adminClient
          .from('team_members')
          .delete()
          .eq('id', data.memberId)

        if (deleteError) {
          console.error('Error removing team member:', deleteError)
          return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case 'approveMember':
        if (!data.memberId) {
          return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        // Approve the member
        const { error: approveError } = await adminClient
          .from('team_members')
          .update({ is_approved: true })
          .eq('id', data.memberId)

        if (approveError) {
          console.error('Error approving team member:', approveError)
          return NextResponse.json({ error: 'Failed to approve team member' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
        
      case 'addMember':
        if (!data.email) {
          return NextResponse.json({ error: 'User email is required' }, { status: 400 })
        }
        
        // First find the user by email
        const { data: userData, error: userError } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('email', data.email.trim())
          .single()
          
        if (userError || !userData) {
          console.error('Error finding user:', userError)
          return NextResponse.json({ error: `User with email ${data.email} not found` }, { status: 404 })
        }
        
        // Check if user is already a member of this team
        const { data: existingMember, error: memberCheckError } = await adminClient
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', userData.id)
          .maybeSingle()
          
        if (existingMember) {
          return NextResponse.json({ error: 'This user is already a member of the team' }, { status: 400 })
        }
        
        // Add the member to the team using admin client to bypass RLS
        const { data: newMember, error: addError } = await adminClient
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: userData.id,
            is_approved: true,  // Admin-added members are auto-approved
            is_leader: false
          })
          .select('id, user_id, is_approved, is_leader')
          .single()
          
        if (addError) {
          console.error('Error adding team member:', addError)
          return NextResponse.json({ error: `Failed to add team member: ${addError.message}` }, { status: 500 })
        }
        
        // Return the new member with the profile info
        return NextResponse.json({ 
          success: true, 
          member: {
            ...newMember,
            profiles: {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name
            }
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin team API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}