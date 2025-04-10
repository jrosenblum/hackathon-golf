import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'

async function getProject(id: string) {
  const supabase = createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description, 
      category,
      technologies,
      project_link,
      is_submitted,
      submission_date,
      team_id,
      teams (
        id,
        name,
        description,
        team_members (
          user_id,
          is_leader,
          is_approved,
          profiles (
            full_name,
            email
          )
        )
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !project) {
    console.error('Error fetching project:', error)
    return null
  }
  
  return project
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  
  if (!project) {
    return notFound()
  }

  const teamMembers = project.teams?.team_members
    ?.filter((member: any) => member.is_approved)
    .map((member: any) => ({
      name: member.profiles?.full_name || 'Unknown',
      email: member.profiles?.email || '',
      isLeader: member.is_leader
    })) || []
  
  return (
    <MainLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Submitted by {project.teams?.name}</p>
          </div>
          <div className="mt-4 md:mt-0">
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
            
            {project.project_link && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Project Link</dt>
                <dd className="mt-1 text-sm text-blue-600 sm:col-span-2 sm:mt-0">
                  <Link href={project.project_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {project.project_link}
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
                <p className="text-sm text-gray-500 mt-1">{project.teams?.description}</p>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Team Members</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <ul className="divide-y divide-gray-200">
                  {teamMembers.map((member: any, index: number) => (
                    <li key={index} className="py-2 flex items-center">
                      <span className="flex-1">{member.name} {member.isLeader && <span className="text-xs text-gray-500">(Team Leader)</span>}</span>
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