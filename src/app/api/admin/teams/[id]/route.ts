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