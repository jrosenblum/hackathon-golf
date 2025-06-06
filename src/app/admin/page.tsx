import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'
import { checkIsAdmin } from '@/lib/auth.server'

async function getAdminStats() {
  const supabase = await createClient()
  
  const { count: hackathonsCount, error: hackathonsError } = await supabase
    .from('hackathons')
    .select('*', { count: 'exact', head: true })
  
  if (hackathonsError) {
    console.error('Error fetching hackathons count:', hackathonsError)
  }
  
  const { count: usersCount, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  if (usersError) {
    console.error('Error fetching users count:', usersError)
  }
  
  const { count: teamsCount, error: teamsError } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
  
  if (teamsError) {
    console.error('Error fetching teams count:', teamsError)
  }
  
  const { count: projectsCount, error: projectsError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
  
  if (projectsError) {
    console.error('Error fetching projects count:', projectsError)
  }
  
  return {
    hackathonsCount: hackathonsCount || 0,
    usersCount: usersCount || 0,
    teamsCount: teamsCount || 0,
    projectsCount: projectsCount || 0
  }
}

export default async function AdminPage() {
  // Admin check is now bypassed in the checkIsAdmin function itself
  await checkIsAdmin()
  const stats = await getAdminStats()
  
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-500 text-white rounded-full">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Hackathons</h3>
                <p className="text-3xl font-bold text-gray-700">{stats.hackathonsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4">
            <Link href="/admin/hackathons" className="text-blue-600 hover:text-blue-800 font-medium">
              Manage hackathons →
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
                <h3 className="text-lg font-medium text-gray-900">Users</h3>
                <p className="text-3xl font-bold text-gray-700">{stats.usersCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4">
            <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 font-medium">
              Manage users →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-500 text-white rounded-full">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Teams</h3>
                <p className="text-3xl font-bold text-gray-700">{stats.teamsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4">
            <Link href="/admin/teams" className="text-blue-600 hover:text-blue-800 font-medium">
              Manage teams →
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
                <p className="text-3xl font-bold text-gray-700">{stats.projectsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4">
            <Link href="/admin/projects" className="text-blue-600 hover:text-blue-800 font-medium">
              Manage projects →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link 
              href="/admin/hackathons/create" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Hackathon
            </Link>
            <Link 
              href="/admin/judges" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Judges
            </Link>
            <Link 
              href="/admin/criteria" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Define Judging Criteria
            </Link>
            <Link 
              href="/admin/results" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              View Results
            </Link>
            <Link 
              href="/admin/faqs" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage FAQs
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
