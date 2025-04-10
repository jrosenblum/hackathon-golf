import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'

async function getProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
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
      teams(id, name, hackathon_id, hackathons(title))
    `)
    .eq('is_submitted', true)
    .order('submission_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  
  return data || []
}

export default async function ProjectsPage() {
  const projects = await getProjects()
  
  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Browse submitted hackathon projects</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/projects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Submit Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No projects submitted yet</h3>
          <p className="mt-1 text-gray-500">Be the first to submit a project for the hackathon.</p>
          <div className="mt-6">
            <Link
              href="/projects/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Submit a Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {projects.map((project: any) => (
              <li key={project.id} className="hover:bg-gray-50">
                <Link href={`/projects/${project.id}`} className="block p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-blue-600 mb-1">{project.title}</h2>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Team:</span> {project.teams?.name}
                      </p>
                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech: string) => (
                              <span key={tech} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end mt-4 md:mt-0">
                      {project.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                          {project.category}
                        </span>
                      )}
                      {project.submission_date && (
                        <span className="text-xs text-gray-500">
                          Submitted: {new Date(project.submission_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </MainLayout>
  )
}