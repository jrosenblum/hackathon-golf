'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { checkIsAdmin } from '@/lib/auth'
// For debugging
import { useEffect } from 'react'

export default function AdminEditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [category, setCategory] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [resourcesUrl, setResourcesUrl] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const projectId = params.id

  // Load project data and check if user is an admin
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get current user and check admin status
        try {
          const isAdminResult = await checkIsAdmin()
          setIsAdmin(true)
        } catch (error) {
          console.error('Not an admin, redirecting:', error)
          router.push('/login')
          return
        }
        
        // Get project details
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
          .single()
        
        if (projectError) {
          throw new Error('Failed to load project')
        }
        
        if (!project) {
          throw new Error('Project not found')
        }
        
        console.log('Project loaded successfully')
        
        // Populate form fields
        setTitle(project.title || '')
        setDescription(project.description || '')
        setTeamId(project.team_id || '')
        setTeamName(project.teams?.name || '')
        setCategory(project.category || '')
        setTechnologies(project.technologies || [])
        setVideoUrl(project.video_url || '')
        setResourcesUrl(project.resources_url || '')
        setIsSubmitted(project.is_submitted || false)
      } catch (error) {
        console.error('Error loading project:', error)
        setError(error instanceof Error ? error.message : 'An error occurred while loading the project')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProject()
  }, [router, projectId])

  const addTechnology = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()])
      setTechInput('')
    }
  }

  const removeTechnology = (techToRemove: string) => {
    setTechnologies(technologies.filter(tech => tech !== techToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Update project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          title,
          description,
          category,
          technologies,
          video_url: videoUrl || null,
          resources_url: resourcesUrl || null,
        })
        .eq('id', projectId)
      
      if (projectError) throw new Error(projectError.message)
      
      // Redirect to admin projects page
      router.push('/admin/projects')
      router.refresh()
    } catch (error) {
      console.error('Error updating project:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while updating the project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    console.log('Delete button clicked - showing confirmation dialog');
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      console.log('Delete cancelled by user');
      return
    }
    
    console.log('User confirmed delete - proceeding with deletion');
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Creating supabase client');
      const supabase = createClient()
      
      // First, get current user to confirm they're an admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
        
      if (!profile?.is_admin) {
        throw new Error('Admin permission required to delete projects')
      }
      
      // Delete the project directly
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      
      if (deleteError) throw new Error(deleteError.message)
      
      // Redirect to admin projects page
      router.push('/admin/projects')
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while deleting the project')
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg className="animate-spin mx-auto h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">Loading project...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const categories = [
    "Web Application",
    "Mobile App",
    "AI/ML",
    "Data Visualization",
    "DevOps",
    "IoT",
    "Blockchain",
    "Gaming",
    "Accessibility",
    "Other"
  ]

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Project (Admin)</h1>
            <p className="mt-2 text-gray-600">
              Update project details as an administrator
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin/projects"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Projects
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">There was an error updating the project</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Danger Zone</h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Project</h4>
              <p className="text-sm text-gray-500">Once you delete a project, it cannot be recovered.</p>
            </div>
            <button
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              onClick={() => {
                console.log("Delete button clicked");
                if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                  console.log("Delete confirmed");
                  const supabase = createClient();
                  
                  // Delete the project
                  supabase
                    .from('projects')
                    .delete()
                    .eq('id', projectId)
                    .then(({ error }) => {
                      if (error) {
                        console.error("Error deleting:", error);
                        setError(error.message || 'Failed to delete project');
                      } else {
                        console.log("Delete successful!");
                        router.push('/admin/projects');
                      }
                    })
                    .catch(err => {
                      console.error("Exception deleting:", err);
                      setError(err instanceof Error ? err.message : 'An error occurred');
                    });
                } else {
                  console.log("Delete cancelled");
                }
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
        
        {/* Project Edit Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <div className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border border-gray-300 rounded-md bg-gray-50">
                    {teamName} <span className="text-sm text-gray-500">(Team ID: {teamId})</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    name="project-title"
                    id="project-title"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="category"
                    name="category"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Describe your project, its purpose, and how it works"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="resources-url" className="block text-sm font-medium text-gray-700 mb-1">Resources Link (Optional)</label>
                  <input
                    type="url"
                    name="resources-url"
                    id="resources-url"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://github.com/your-username/your-project"
                    value={resourcesUrl}
                    onChange={(e) => setResourcesUrl(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">Demo Video Link (Optional)</label>
                  <input
                    type="url"
                    name="video-url"
                    id="video-url"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://www.youtube.com/watch?v=example"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="technologies"
                      id="technologies"
                      className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                      placeholder="React, Node.js, MongoDB, etc."
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 sm:text-sm hover:bg-gray-100"
                      onClick={addTechnology}
                    >
                      Add
                    </button>
                  </div>

                  {technologies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Added Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => (
                          <span key={tech} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {tech}
                            <button
                              type="button"
                              className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-500 focus:text-white"
                              onClick={() => removeTechnology(tech)}
                            >
                              <span className="sr-only">Remove {tech}</span>
                              <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Status: {isSubmitted ? 
                      <span className="font-medium text-green-600">Submitted</span> : 
                      <span className="font-medium text-yellow-600">Draft</span>
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                onClick={() => router.push('/admin/projects')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}