import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'
import TeamsList from '@/components/teams/TeamsList'

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
      team_members!inner(user_id, is_approved, is_leader)
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

      {/* Using client component to show pending status */}
      <TeamsList teams={teams} />
    </MainLayout>
  )
}