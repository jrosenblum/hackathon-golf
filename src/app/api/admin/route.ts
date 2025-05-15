import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // First, authenticate the user with the server component client
    // This is crucial for cookie handling in Next.js App Router
    const supabase = createServerComponentClient({ cookies })
    
    console.log("[ADMIN-API] Checking authentication...")
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("[ADMIN-API] Auth error:", userError)
      return NextResponse.json(
        { error: 'Authentication error: ' + userError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error("[ADMIN-API] No user found")
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      )
    }
    
    console.log("[ADMIN-API] User authenticated:", user.id)

    // Check if the user is an admin in our database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { action, data } = body

    // Only proceed with the admin client if the user is authenticated and verified as admin
    const adminClient = createAdminClient()

    // Handle different admin actions
    switch (action) {
      case 'updateUserAdmin':
        if (!data.userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ is_admin: data.isAdmin })
          .eq('id', data.userId)

        if (updateError) {
          console.error('Error updating user admin status:', updateError)
          return NextResponse.json({ error: 'Failed to update user admin status' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case 'updateTeamLeader':
        if (!data.memberId) {
          return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        console.log('[ADMIN-API] Updating team leader status for:', data.memberId, 'to:', data.isLeader)
        
        const { error: leaderError } = await adminClient
          .from('team_members')
          .update({ is_leader: data.isLeader })
          .eq('id', data.memberId)

        if (leaderError) {
          console.error('Error updating team leader status:', leaderError)
          return NextResponse.json({ error: 'Failed to update team leader status' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
        
      case 'demoteTeamLeader':
        if (!data.memberId) {
          return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        console.log('[ADMIN-API] Demoting team leader:', data.memberId)
        
        const { error: demoteError } = await adminClient
          .from('team_members')
          .update({ is_leader: false })
          .eq('id', data.memberId)

        if (demoteError) {
          console.error('Error demoting team leader:', demoteError)
          return NextResponse.json({ error: 'Failed to demote team leader' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      // Add other admin operations as needed
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}