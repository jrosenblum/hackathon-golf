import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // First, authenticate the user with the regular client
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
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