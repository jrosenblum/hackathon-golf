import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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

    // Parse the request body
    const body = await request.json()
    const { scores, feedback, hackathonId } = body
    const projectId = params.projectId

    // Check if the user is a judge for this hackathon
    const { data: judgeData, error: judgeError } = await supabase
      .from('judges')
      .select('id')
      .eq('user_id', user.id)
      .eq('hackathon_id', hackathonId)
      .single()

    if (judgeError || !judgeData) {
      console.error('Judge verification error:', judgeError)
      return NextResponse.json(
        { error: 'You are not authorized to judge this project' },
        { status: 403 }
      )
    }

    const judgeId = judgeData.id

    // Use admin client for database operations to bypass RLS
    const adminClient = createAdminClient()

    // First, delete existing scores for this judge and project to avoid conflicts
    const { error: deleteError } = await adminClient
      .from('project_scores')
      .delete()
      .eq('project_id', projectId)
      .eq('judge_id', judgeId)

    if (deleteError) {
      console.error('Error deleting existing scores:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing scores' },
        { status: 500 }
      )
    }

    // Prepare scores for insertion
    const scoresToInsert = scores.map((score: any) => ({
      project_id: projectId,
      judge_id: judgeId,
      criteria_id: score.criteriaId,
      score: score.score,
      feedback: feedback || null
    }))

    // Insert new scores
    const { data: insertedScores, error: insertError } = await adminClient
      .from('project_scores')
      .insert(scoresToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting scores:', insertError)
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Scores saved successfully',
      data: insertedScores
    })

  } catch (error) {
    console.error('Judging API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}