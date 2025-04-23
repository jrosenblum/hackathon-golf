import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { checkIsAdmin } from '@/lib/auth.server'

async function getHackathon(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hackathons')
    .select('id, title')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching hackathon:', error)
    return null
  }
  
  return data
}

async function getSubmittedProjects(hackathonId: string) {
  const supabase = await createClient()
  
  // First get the teams for this hackathon
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('hackathon_id', hackathonId)
  
  if (teamsError || !teams || teams.length === 0) {
    console.error('Error fetching teams or no teams found:', teamsError)
    return []
  }
  
  // Get the team IDs
  const teamIds = teams.map(team => team.id)
  
  // Now get the submitted projects for these teams
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      category,
      technologies,
      submission_date,
      team_id,
      is_submitted,
      teams (
        id,
        name,
        team_members (
          user_id,
          is_leader,
          profiles (
            full_name,
            email
          )
        )
      )
    `)
    .in('team_id', teamIds)
    .eq('is_submitted', true)
    .order('submission_date', { ascending: false })
  
  if (projectsError) {
    console.error('Error fetching projects:', projectsError)
    return []
  }
  
  return projects || []
}

// Tell Next.js this page is dynamic and can't be statically generated
export const dynamic = 'force-dynamic';

export default async function HackathonSubmissionsPage({ params }: { params: { id: string } }) {
  await checkIsAdmin()
  
  const hackathonId = params.id
  const hackathon = await getHackathon(hackathonId)
  const submittedProjects = await getSubmittedProjects(hackathonId)
  
  if (!hackathon) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Hackathon not found</h3>
            <p className="mt-1 text-gray-500">The hackathon you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <div className="mt-6">
              <Link
                href="/admin/hackathons"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Hackathons
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Submissions</h1>
            <p className="mt-2 text-gray-600">
              Viewing submissions for {hackathon.title}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              href={`/admin/hackathons/${hackathonId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Hackathon
            </Link>
          </div>
        </div>

        {submittedProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Submissions Yet</h3>
            <p className="mt-1 text-gray-500">There are no submitted projects for this hackathon yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Submitted Projects ({submittedProjects.length})</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {submittedProjects.map((project) => {
                // Get the team name
                const teamName = project.teams?.name || 'Unknown Team'
                
                // Get team members
                const teamMembers = project.teams?.team_members || []
                
                // Find the team leader
                const teamLeader = teamMembers.find((member: any) => member.is_leader)
                const leaderName = teamLeader?.profiles?.full_name || 'Unknown'
                
                // Format submission date
                const submissionDate = project.submission_date 
                  ? new Date(project.submission_date).toLocaleString() 
                  : 'Unknown'
                
                return (
                  <li key={project.id} className="px-4 py-6 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-blue-600">
                          <Link href={`/projects/${project.id}`} className="hover:underline">
                            {project.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Team:</span>{' '}
                          <Link href={`/teams/${project.team_id}`} className="text-blue-600 hover:underline">
                            {teamName}
                          </Link>
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Team Leader:</span> {leaderName}
                        </p>
                        {project.category && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {project.category}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0 sm:text-right">
                        <p className="text-sm text-gray-500">Submitted on</p>
                        <p className="text-sm font-medium">{submissionDate}</p>
                        <div className="mt-2">
                          <Link 
                            href={`/projects/${project.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md leading-5 font-medium text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                          >
                            View Project
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description && project.description.length > 150
                          ? `${project.description.substring(0, 150)}...`
                          : project.description}
                      </p>
                    </div>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.technologies.map((tech: string) => (
                          <span
                            key={tech}
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </MainLayout>
  )
}