import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'
import { checkIsAdmin } from '@/lib/auth.server'

async function getTeam(teamId: string) {
  const supabase = await createClient()
  
  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      hackathons (id, title),
      team_members (
        id,
        user_id,
        is_approved,
        is_leader,
        profiles (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('id', teamId)
    .single()
  
  if (error || !team) {
    console.error('Error fetching team:', error)
    return null
  }
  
  // Process members data
  const members = team.team_members || []
  const approvedMembers = members.filter(member => member.is_approved)
  const pendingMembers = members.filter(member => !member.is_approved)
  
  return {
    ...team,
    approvedMembers,
    pendingMembers,
    memberCount: approvedMembers.length,
    pendingCount: pendingMembers.length
  }
}

export default async function AdminTeamDetailPage({ params }: { params: { id: string } }) {
  await checkIsAdmin()
  const team = await getTeam(params.id)
  
  if (!team) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto text-center py-12">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Team Not Found</h3>
              <p className="mt-1 text-sm text-gray-500">The team you are looking for does not exist or you do not have permission to view it.</p>
              <div className="mt-6">
                <Link
                  href="/admin/teams"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Back to Teams
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  const createdDate = new Date(team.created_at).toLocaleDateString()
  const lastUpdated = new Date(team.updated_at).toLocaleDateString()
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team: {team.name}</h1>
            <p className="mt-2 text-gray-600">
              Admin view of team details and members
            </p>
          </div>
          <div className="mt-4 md:mt-0 space-x-3">
            <Link
              href={`/admin/teams/${team.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit Team
            </Link>
            <Link
              href="/admin/teams"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Teams
            </Link>
          </div>
        </div>

        {/* Team Details Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Details</h3>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Team ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{team.id}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Hackathon</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/admin/hackathons/${team.hackathon_id}`} className="text-blue-600 hover:text-blue-800">
                    {team.hackathons?.title || 'No Hackathon'}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{createdDate}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{lastUpdated}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Looking For Members</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {team.looking_for_members ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No</span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Team Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  {team.pendingCount > 0 && (
                    <span className="ml-2 text-yellow-600">
                      (+{team.pendingCount} pending)
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{team.description || 'No description provided.'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Skills Needed</dt>
                <dd className="mt-1">
                  {team.needed_skills && team.needed_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {team.needed_skills.map((skill: string) => (
                        <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No specific skills listed</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Approved Members ({team.approvedMembers.length})</h3>
          </div>
          <div className="px-6 py-4">
            {team.approvedMembers.length === 0 ? (
              <p className="text-sm text-gray-500">This team has no approved members yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {team.approvedMembers.map((member: any) => (
                  <li key={member.id} className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.profiles?.full_name || 'Unknown User'}
                          {member.is_leader && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Team Leader
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${member.user_id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pending Members Card */}
        {team.pendingCount > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Requests ({team.pendingCount})</h3>
            </div>
            <div className="px-6 py-4">
              <ul className="divide-y divide-gray-200">
                {team.pendingMembers.map((member: any) => (
                  <li key={member.id} className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{member.profiles?.full_name || 'Unknown User'}</h4>
                        <p className="text-sm text-gray-500">{member.profiles?.email || ''}</p>
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${member.user_id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}