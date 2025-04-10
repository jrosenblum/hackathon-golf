'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

// Helper function to format dates
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function HackathonDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const hackathonId = params.id as string
  
  const [hackathon, setHackathon] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPhase, setCurrentPhase] = useState<string>('')
  
  useEffect(() => {
    const fetchHackathonData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Get hackathon details
        const { data: hackathonData, error: hackathonError } = await supabase
          .from('hackathons')
          .select('*')
          .eq('id', hackathonId)
          .single()
        
        if (hackathonError) throw new Error(hackathonError.message)
        if (!hackathonData) throw new Error('Hackathon not found')
        
        setHackathon(hackathonData)
        
        // Get teams for this hackathon
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            description,
            created_at,
            looking_for_members,
            needed_skills,
            team_members!inner (id)
          `)
          .eq('hackathon_id', hackathonId)
          .order('created_at', { ascending: false })
        
        if (teamsError) throw new Error(teamsError.message)
        
        // Process teams data to include member count
        const processedTeams = teamsData?.map(team => ({
          ...team,
          member_count: team.team_members?.length || 0
        })) || [];
        
        setTeams(processedTeams)
        
        // Determine current phase
        const now = new Date();
        const hackathon = hackathonData;
        
        if (now < new Date(hackathon.registration_deadline)) {
          setCurrentPhase('registration');
        } else if (now < new Date(hackathon.team_formation_deadline)) {
          setCurrentPhase('team_formation');
        } else if (now < new Date(hackathon.start_date)) {
          setCurrentPhase('preparation');
        } else if (now < new Date(hackathon.submission_deadline)) {
          setCurrentPhase('hacking');
        } else if (now < new Date(hackathon.judging_end)) {
          setCurrentPhase('judging');
        } else {
          setCurrentPhase('completed');
        }
        
      } catch (error) {
        console.error('Error fetching hackathon data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchHackathonData()
  }, [hackathonId])
  
  // Get status badge class based on current phase
  const getStatusBadgeClass = () => {
    switch (currentPhase) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'team_formation':
      case 'preparation':
        return 'bg-indigo-100 text-indigo-800';
      case 'hacking':
        return 'bg-green-100 text-green-800';
      case 'judging':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  const getStatusText = () => {
    switch (currentPhase) {
      case 'registration': return 'Registration Open';
      case 'team_formation': return 'Team Formation';
      case 'preparation': return 'Preparation';
      case 'hacking': return 'In Progress';
      case 'judging': return 'Judging';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </MainLayout>
    )
  }
  
  if (error || !hackathon) {
    return (
      <MainLayout>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-gray-500">{error || 'Hackathon not found'}</p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{hackathon.title}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
              {getStatusText()}
            </span>
          </div>
          {hackathon.is_active && currentPhase !== 'completed' ? (
            <p className="mt-2 text-sm text-gray-600">
              {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              This hackathon {currentPhase === 'completed' ? 'ended' : 'starts'} on {formatDate(currentPhase === 'completed' ? hackathon.end_date : hackathon.start_date)}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Hackathon Info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">Hackathon Details</h2>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap mb-6">{hackathon.description}</p>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Important Dates</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Deadline:</span>
                  <span className="font-medium">{formatDate(hackathon.registration_deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team Formation Deadline:</span>
                  <span className="font-medium">{formatDate(hackathon.team_formation_deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hackathon Begins:</span>
                  <span className="font-medium">{formatDate(hackathon.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Submission Deadline:</span>
                  <span className="font-medium">{formatDate(hackathon.submission_deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Judging Period:</span>
                  <span className="font-medium">{formatDate(hackathon.judging_start)} - {formatDate(hackathon.judging_end)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Teams */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Participating Teams ({teams.length})</h2>
              {(currentPhase === 'registration' || currentPhase === 'team_formation') && (
                <Link
                  href={`/teams/create?hackathon=${hackathonId}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Team
                </Link>
              )}
            </div>
            
            {teams.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {teams.map((team) => (
                  <li key={team.id} className="hover:bg-gray-50">
                    <Link href={`/teams/${team.id}`} className="block px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium text-blue-600">{team.name}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description}</p>
                          
                          {team.needed_skills && team.needed_skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {team.needed_skills.map((skill: string) => (
                                <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-500">{team.member_count} members</span>
                          {team.looking_for_members && (
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Looking for members
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No teams have joined this hackathon yet.</p>
                {(currentPhase === 'registration' || currentPhase === 'team_formation') && (
                  <div className="mt-4">
                    <Link
                      href={`/teams/create?hackathon=${hackathonId}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create the First Team
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Hackathon Timeline</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className={`bg-${new Date() < new Date(hackathon.registration_deadline) ? 'green' : 'gray'}-500 rounded-full h-8 w-8 flex items-center justify-center text-white`}>
                    {new Date() < new Date(hackathon.registration_deadline) ? '1' : '✓'}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Registration</p>
                    <p className="text-sm text-gray-500">Until {new Date(hackathon.registration_deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className={`${new Date() >= new Date(hackathon.registration_deadline) && new Date() < new Date(hackathon.team_formation_deadline) ? 'bg-green-500' : 'bg-gray-300'} rounded-full h-8 w-8 flex items-center justify-center text-white`}>
                    {new Date() < new Date(hackathon.team_formation_deadline) && new Date() >= new Date(hackathon.registration_deadline) ? '2' : (new Date() >= new Date(hackathon.team_formation_deadline) ? '✓' : '2')}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Team Formation</p>
                    <p className="text-sm text-gray-500">Until {new Date(hackathon.team_formation_deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className={`${new Date() >= new Date(hackathon.start_date) && new Date() < new Date(hackathon.submission_deadline) ? 'bg-green-500' : 'bg-gray-300'} rounded-full h-8 w-8 flex items-center justify-center text-white`}>
                    {new Date() < new Date(hackathon.submission_deadline) && new Date() >= new Date(hackathon.start_date) ? '3' : (new Date() >= new Date(hackathon.submission_deadline) ? '✓' : '3')}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Hacking Period</p>
                    <p className="text-sm text-gray-500">{new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.submission_deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
              
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className={`${new Date() >= new Date(hackathon.judging_start) && new Date() < new Date(hackathon.judging_end) ? 'bg-green-500' : 'bg-gray-300'} rounded-full h-8 w-8 flex items-center justify-center text-white`}>
                    {new Date() < new Date(hackathon.judging_end) && new Date() >= new Date(hackathon.judging_start) ? '4' : (new Date() >= new Date(hackathon.judging_end) ? '✓' : '4')}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Judging</p>
                    <p className="text-sm text-gray-500">{new Date(hackathon.judging_start).toLocaleDateString()} - {new Date(hackathon.judging_end).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link
                href={`/teams?hackathon=${hackathonId}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse All Teams
              </Link>
              
              {(currentPhase === 'registration' || currentPhase === 'team_formation') && (
                <Link
                  href={`/teams/create?hackathon=${hackathonId}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create New Team
                </Link>
              )}
              
              {currentPhase === 'hacking' && (
                <Link
                  href={`/projects/create?hackathon=${hackathonId}`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Submit Project
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}