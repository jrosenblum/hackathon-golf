import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'

// Helper function to format dates
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Function to determine the current phase of a hackathon
function getHackathonPhase(hackathon: any): {
  phase: 'registration' | 'team_formation' | 'hacking' | 'submission' | 'judging' | 'completed',
  nextDeadline: string,
  nextDeadlineDate: string
} {
  const now = new Date();
  
  if (now < new Date(hackathon.registration_deadline)) {
    return {
      phase: 'registration',
      nextDeadline: 'Registration Deadline',
      nextDeadlineDate: hackathon.registration_deadline
    };
  } else if (now < new Date(hackathon.team_formation_deadline)) {
    return {
      phase: 'team_formation',
      nextDeadline: 'Team Formation Deadline',
      nextDeadlineDate: hackathon.team_formation_deadline
    };
  } else if (now < new Date(hackathon.start_date)) {
    return {
      phase: 'team_formation',
      nextDeadline: 'Hackathon Begins',
      nextDeadlineDate: hackathon.start_date
    };
  } else if (now < new Date(hackathon.submission_deadline)) {
    return {
      phase: 'hacking',
      nextDeadline: 'Project Submission Deadline',
      nextDeadlineDate: hackathon.submission_deadline
    };
  } else if (now < new Date(hackathon.judging_end)) {
    return {
      phase: 'judging',
      nextDeadline: 'Judging Ends',
      nextDeadlineDate: hackathon.judging_end
    };
  } else {
    return {
      phase: 'completed',
      nextDeadline: 'Hackathon Completed',
      nextDeadlineDate: hackathon.end_date
    };
  }
}

// Function to render the status badge
function HackathonStatusBadge({ phase }: { phase: string }) {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let label = 'Unknown';
  
  switch (phase) {
    case 'registration':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      label = 'Registration Open';
      break;
    case 'team_formation':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      label = 'Team Formation';
      break;
    case 'hacking':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'In Progress';
      break;
    case 'submission':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = 'Submissions Due';
      break;
    case 'judging':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      label = 'Judging';
      break;
    case 'completed':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = 'Completed';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get all active and upcoming hackathons
  const now = new Date().toISOString();
  const { data: hackathons } = await supabase
    .from('hackathons')
    .select('*')
    .or(`end_date.gt.${now},is_active.eq.true`)
    .order('start_date', { ascending: true })
    .limit(5);
  
  // Separate active and upcoming hackathons
  const activeHackathons = hackathons?.filter(h => 
    new Date(h.start_date) <= new Date() && new Date(h.end_date) >= new Date()
  ) || [];
  
  const upcomingHackathons = hackathons?.filter(h => 
    new Date(h.start_date) > new Date()
  ) || [];
  
  return (
    <MainLayout>
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

      {/* Active Hackathons */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Hackathons</h2>
        {activeHackathons.length > 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {activeHackathons.map((hackathon) => {
                const { phase, nextDeadline, nextDeadlineDate } = getHackathonPhase(hackathon);
                return (
                  <li key={hackathon.id} className="px-6 py-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div className="mb-2 sm:mb-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{hackathon.title}</h3>
                          <HackathonStatusBadge phase={phase} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium text-gray-700">Next: {nextDeadline}</p>
                        <p className="text-sm text-gray-500">{formatDate(nextDeadlineDate)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <Link
                        href={`/hackathons/${hackathon.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/teams?hackathon=${hackathon.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Browse Teams
                      </Link>
                      <Link
                        href={`/teams/create?hackathon=${hackathon.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Create Team
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Hackathons</h3>
            <p className="mt-1 text-gray-500">Check back later or view upcoming hackathons below.</p>
          </div>
        )}
      </div>

      {/* Upcoming Hackathons */}
      {upcomingHackathons.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Hackathons</h2>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {upcomingHackathons.map((hackathon) => (
                <li key={hackathon.id} className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">{hackathon.title}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Upcoming
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-sm font-medium text-gray-700">Registration Opens</p>
                      <p className="text-sm text-gray-500">Now</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/hackathons/${hackathon.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </MainLayout>
  )
}