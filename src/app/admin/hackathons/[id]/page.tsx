import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function checkIsAdmin() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()
  
  if (!profile?.is_admin) {
    redirect('/dashboard')
  }
  
  return true
}

async function getHackathon(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('hackathons')
    .select(`
      *,
      teams (
        id,
        name,
        team_members (
          user_id
        )
      ),
      projects (
        id,
        title,
        is_submitted
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching hackathon:', error)
    return null
  }
  
  // Count team members and submitted projects
  let teamMemberCount = 0
  let submittedProjectsCount = 0
  
  data.teams?.forEach(team => {
    teamMemberCount += team.team_members?.length || 0
  })
  
  data.projects?.forEach(project => {
    if (project.is_submitted) submittedProjectsCount++
  })
  
  return {
    ...data,
    teamMemberCount,
    submittedProjectsCount,
    teamsCount: data.teams?.length || 0,
    projectsCount: data.projects?.length || 0
  }
}

export default async function HackathonDetailPage({ params }: { params: { id: string } }) {
  await checkIsAdmin()
  const hackathon = await getHackathon(params.id)
  
  if (!hackathon) {
    return (
      <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Hackathon not found</h3>
            <p className="mt-1 text-gray-500">The hackathon you're looking for doesn't exist or you don't have permission to view it.</p>
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
      </div>
    )
  }
  
  // Format dates for display
  const startDate = new Date(hackathon.start_date).toLocaleDateString()
  const endDate = new Date(hackathon.end_date).toLocaleDateString()
  const registrationDeadline = new Date(hackathon.registration_deadline).toLocaleDateString()
  const teamFormationDeadline = new Date(hackathon.team_formation_deadline).toLocaleDateString()
  const submissionDeadline = new Date(hackathon.submission_deadline).toLocaleDateString()
  const judgingStart = new Date(hackathon.judging_start).toLocaleDateString()
  const judgingEnd = new Date(hackathon.judging_end).toLocaleDateString()
  
  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{hackathon.title}</h1>
            <p className="mt-2 text-gray-600">
              {hackathon.description}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              href={`/admin/hackathons/${hackathon.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit Hackathon
            </Link>
            <Link
              href="/admin/hackathons"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          {hackathon.is_active ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active Hackathon
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Inactive Hackathon
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Teams</h3>
                  <p className="text-3xl font-bold text-gray-700">{hackathon.teamsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link 
                href={`/admin/hackathons/${hackathon.id}/teams`} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Teams →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Participants</h3>
                  <p className="text-3xl font-bold text-gray-700">{hackathon.teamMemberCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link 
                href={`/admin/hackathons/${hackathon.id}/participants`} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Participants →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                  <p className="text-3xl font-bold text-gray-700">{hackathon.projectsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link 
                href={`/admin/hackathons/${hackathon.id}/projects`} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Projects →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Submissions</h3>
                  <p className="text-3xl font-bold text-gray-700">{hackathon.submittedProjectsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link 
                href={`/admin/hackathons/${hackathon.id}/submissions`} 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Submissions →
              </Link>
            </div>
          </div>
        </div>

        {/* Hackathon Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Hackathon Details</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">{startDate} to {endDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">{registrationDeadline}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Team Formation Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">{teamFormationDeadline}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Submission Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">{submissionDeadline}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Judging Period</dt>
                <dd className="mt-1 text-sm text-gray-900">{judgingStart} to {judgingEnd}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Maximum Team Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{hackathon.max_team_size} members</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hackathon.is_active ? (
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700">
                  Deactivate Hackathon
                </button>
              ) : (
                <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Activate Hackathon
                </button>
              )}
              <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                Delete Hackathon
              </button>
              <Link 
                href={`/admin/hackathons/${hackathon.id}/judges`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Judges
              </Link>
              <Link 
                href={`/admin/hackathons/${hackathon.id}/criteria`}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Define Judging Criteria
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}