import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'

async function getTeams() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      description,
      looking_for_members,
      needed_skills,
      created_at,
      profiles(full_name, email),
      team_members(user_id, is_approved, is_leader)
    `)
    .eq('looking_for_members', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }
  
  return data || []
}

export default async function TeamsPage() {
  const teams = await getTeams()
  
  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">Browse available teams or create your own</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/teams/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Team
          </Link>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No teams available</h3>
          <p className="mt-1 text-gray-500">Be the first to create a team for the hackathon.</p>
          <div className="mt-6">
            <Link
              href="/teams/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create a Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {teams.map((team: any) => {
              const memberCount = team.team_members?.filter((m: any) => m.is_approved).length || 0
              
              return (
                <li key={team.id} className="hover:bg-gray-50">
                  <Link href={`/teams/${team.id}`} className="block p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-blue-600 mb-1">{team.name}</h2>
                        <p className="text-gray-600 mb-3 line-clamp-2">{team.description}</p>
                        
                        {team.needed_skills && team.needed_skills.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500 mr-2">Skills needed:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {team.needed_skills.map((skill: string) => (
                                <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end mt-4 md:mt-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                        </span>
                        {team.looking_for_members && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Looking for members
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </MainLayout>
  )
}