import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Force dynamic rendering to ensure fresh auth state
export const dynamic = 'force-dynamic';

/**
 * Check if the current user is an admin
 */
async function isAdmin() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  return profile?.is_admin === true;
}

/**
 * DELETE - Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const projectId = params.id;
    
    // Use the admin client for database operations
    const supabase = createAdminClient();
    
    // Delete the project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json(
        { message: deleteError.message || 'Failed to delete project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in delete project API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get project details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const projectId = params.id;
    
    // Use the admin client for database operations
    const supabase = createAdminClient();
    
    // Get the project with related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        teams (
          id,
          name
        )
      `)
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Error getting project:', projectError);
      return NextResponse.json(
        { message: projectError.message || 'Failed to get project' },
        { status: 500 }
      );
    }
    
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
    
  } catch (error) {
    console.error('Error in get project API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is an admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const projectId = params.id;
    const requestData = await request.json();
    
    // Use the admin client for database operations
    const supabase = createAdminClient();
    
    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(requestData)
      .eq('id', projectId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating project:', updateError);
      return NextResponse.json(
        { message: updateError.message || 'Failed to update project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedProject);
    
  } catch (error) {
    console.error('Error in update project API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}