import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import UserAdminControls from '@/components/admin/UserAdminControls'
import { checkIsAdmin } from '@/lib/auth.server'

async function getUser(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  
  return data
}

// Tell Next.js this page is dynamic and can't be statically generated
export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: { id: string } }) {
  await checkIsAdmin()
  const user = await getUser(params.id)
  
  if (!user) {
    return notFound()
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-2 text-gray-600">
              Update user information and privileges
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/admin/users" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Back to Users
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                {user.avatar_url ? (
                  <img className="h-16 w-16 rounded-full object-cover" src={user.avatar_url} alt={user.full_name || "User avatar"} />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xl font-medium">
                      {(user.full_name || "User").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-5">
                <h2 className="text-xl font-bold text-gray-900">{user.full_name || "Unnamed User"}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.is_admin && (
                  <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Information</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.full_name || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.department || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.role || "Not provided"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
          
          <div className="px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900">Administrative Actions</h3>
            <p className="mt-1 text-sm text-gray-500">
              These actions affect user permissions across the application. Use with caution.
            </p>
            
            {/* Client-side component for admin controls */}
            <UserAdminControls userId={user.id} isAdmin={user.is_admin} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}