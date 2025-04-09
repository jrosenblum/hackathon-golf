import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hackathon Dashboard</h1>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Hackathon Platform</h2>
          <p className="text-gray-600">
            Get started by completing your profile, joining a team, or submitting a project.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
                  <p className="text-sm text-gray-500">Complete your profile</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link href="/profile" className="text-blue-600 hover:text-blue-800 font-medium">
                Update Profile →
              </Link>
            </div>
          </div>

          {/* Team Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Team Formation</h3>
                  <p className="text-sm text-gray-500">Find or create a team</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between">
              <Link href="/teams" className="text-blue-600 hover:text-blue-800 font-medium">
                Browse Teams
              </Link>
              <Link href="/teams/create" className="text-blue-600 hover:text-blue-800 font-medium">
                Create Team
              </Link>
            </div>
          </div>

          {/* Project Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-500 text-white rounded-full">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Project Submission</h3>
                  <p className="text-sm text-gray-500">Submit and manage your project</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <Link href="/projects" className="text-blue-600 hover:text-blue-800 font-medium">
                Manage Project →
              </Link>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hackathon Timeline</h2>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    ✓
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Registration Open</p>
                    <p className="text-sm text-gray-500">Now</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    2
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Team Formation Deadline</p>
                    <p className="text-sm text-gray-500">October 5, 2023</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    3
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Hackathon Begins</p>
                    <p className="text-sm text-gray-500">October 15, 2023</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    4
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Project Submission Deadline</p>
                    <p className="text-sm text-gray-500">October 20, 2023</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}