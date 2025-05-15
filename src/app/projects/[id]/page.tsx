import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

async function getProject(id: string) {
  // Use the server component client for better cookie handling
  const supabase = createServerComponentClient({ cookies })
  
  console.log(`Fetching project with ID: ${id}`)
  
  try {
    // Try a simplified query first to check if the project exists
    const { data: basicProject, error: basicError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', id)
      .maybeSingle()
    
    if (basicError) {
      console.error('Error checking if project exists:', basicError.message || JSON.stringify(basicError))
      return null
    }
    
    if (!basicProject) {
      console.error(`Project with ID ${id} does not exist`)
      return null
    }
    
    console.log(`Found basic project with title: ${basicProject.title}`)
    
    // If the project exists, fetch it with all its related data
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description, 
        category,
        technologies,
        video_url,
        resources_url,
        is_submitted,
        submission_date,
        team_id,
        teams!inner (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching project details:', error.message || JSON.stringify(error))
      return null
    }
    
    // Now fetch team members in a separate query to simplify
    // Make sure to include the team member ID to facilitate checking leadership status
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        is_leader,
        is_approved,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('team_id', project.team_id)
      .eq('is_approved', true)
    
    if (teamMembersError) {
      console.error('Error fetching team members:', teamMembersError.message || JSON.stringify(teamMembersError))
    } else {
      // Add team members to the project
      project.team_members = teamMembers || []
    }
    
    console.log('Project fetched successfully:', project.title)
    
    return project
  } catch (err) {
    console.error('Unexpected error in getProject:', err)
    return null
  }
}

async function getCurrentUserId() {
  try {
    console.log("Getting current user ID using server component client...")
    
    // Create a server component client with cookies access
    const supabase = createServerComponentClient({ cookies })
    
    // Try to get the session first (more reliable in server components)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message)
    } else if (session?.user) {
      console.log(`Found user via session: ${session.user.id}`)
      return session.user.id
    }
    
    // Also try getUser as a fallback
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError.message)
      return null
    }
    
    if (!user) {
      console.log('No user found - not authenticated')
      return null
    }
    
    console.log(`Found user via getUser: ${user.id}`)
    return user.id
  } catch (error) {
    console.error('Unexpected error getting current user:', error)
    return null
  }
}

async function isUserTeamLeader(userId: string | null, teamId: string) {
  if (!userId) {
    console.log('No user ID provided, cannot check team leader status')
    return false
  }
  
  try {
    // Use the server component client that has access to cookies
    const supabase = createServerComponentClient({ cookies })
    
    // Log the check we're about to perform
    console.log(`====== TEAM LEADER CHECK ======`)
    console.log(`Checking if user ${userId} is a leader for team ${teamId}`)
    
    // First, check if the team exists
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single()
      
    if (teamError) {
      console.error('Error fetching team:', teamError.message)
      return false
    }
    
    console.log(`Team found: ${team.name} (${team.id})`)
    
    // Now get ALL members of this team for debugging
    const { data: allMembers, error: allMembersError } = await supabase
      .from('team_members')
      .select('id, user_id, is_leader, is_approved')
      .eq('team_id', teamId)
    
    if (allMembersError) {
      console.error('Error fetching all team members:', allMembersError.message)
    } else {
      console.log('All team members:', JSON.stringify(allMembers))
    }
    
    // Now perform the actual leadership check
    const { data, error } = await supabase
      .from('team_members')
      .select('id, is_leader, user_id, is_approved')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('is_approved', true)
      .single()
    
    if (error) {
      console.error('Error checking team leader status:', error.message)
      console.log('Error details:', JSON.stringify(error))
      return false
    }
    
    if (!data) {
      console.log(`No approved team member record found for user ${userId} in team ${teamId}`)
      return false
    }
    
    console.log(`Team member record found:`, JSON.stringify(data))
    console.log(`User ${userId} is${data.is_leader ? '' : ' not'} a team leader for team ${teamId}`)
    console.log(`====== END TEAM LEADER CHECK ======`)
    
    return data.is_leader
  } catch (error) {
    console.error('Error checking if user is team leader:', error)
    return false
  }
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  // For server components, we can directly use the id from params 
  // as this is a server-side rendering function
  const { id } = params
  const project = await getProject(id)
  
  if (!project) {
    return notFound()
  }

  const userId = await getCurrentUserId()
  console.log(`Current user ID: ${userId || 'Not logged in'}`)
  console.log(`Project team ID: ${project.team_id}`)
  
  // Debug the team leader permission check
  const canEdit = await isUserTeamLeader(userId, project.team_id)
  console.log(`Can user edit project: ${canEdit ? 'YES' : 'NO'}`)

  // Debug team members
  console.log('Raw team members data:', JSON.stringify(project.team_members));
  
  const teamMembers = project.team_members
    ?.map((member: any) => ({
      name: member.profiles?.full_name || 'Unknown',
      email: member.profiles?.email || '',
      isLeader: member.is_leader,
      userId: member.user_id // Track user ID for debugging
    })) || []
    
  console.log('Processed team members:', JSON.stringify(teamMembers));
  
  return (
    <MainLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Submitted by {project.teams?.name || 'Team'}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            {canEdit && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Project
              </Link>
            )}
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Projects
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {project.category || 'Not specified'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                {project.description}
              </dd>
            </div>
            
            
            {project.resources_url && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Resources Link</dt>
                <dd className="mt-1 text-sm text-blue-600 sm:col-span-2 sm:mt-0">
                  <Link href={project.resources_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {project.resources_url}
                  </Link>
                </dd>
              </div>
            )}
            
            {project.video_url && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Demo Video</dt>
                <dd className="mt-1 text-sm text-blue-600 sm:col-span-2 sm:mt-0">
                  <Link href={project.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {project.video_url}
                  </Link>
                </dd>
              </div>
            )}
            
            {project.technologies && project.technologies.length > 0 && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Technologies</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech: string) => (
                      <span 
                        key={tech}
                        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Team</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <Link href={`/teams/${project.team_id}`} className="text-blue-600 hover:underline font-medium">
                  {project.teams?.name || 'Unknown team'}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{project.teams?.description || 'No description available'}</p>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Team Members</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <ul className="divide-y divide-gray-200">
                  {teamMembers.map((member: any, index: number) => (
                    <li key={index} className="py-2 flex items-center">
                      <span className="flex-1">
                        {member.name}
                        {member.isLeader && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Team Leader
                          </span>
                        )}
                      </span>
                      <span className="text-gray-500 text-sm">{member.email}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submission Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {project.submission_date ? new Date(project.submission_date).toLocaleString() : 'Unknown'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </MainLayout>
  )
}