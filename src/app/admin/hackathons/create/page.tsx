'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { addDefaultCriteriaToHackathon } from '@/lib/judging'

export default function CreateHackathonPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Hackathon fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [teamFormationDeadline, setTeamFormationDeadline] = useState('')
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  const [judgingStart, setJudgingStart] = useState('')
  const [judgingEnd, setJudgingEnd] = useState('')
  const [maxTeamSize, setMaxTeamSize] = useState('5')
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw new Error(profileError.message)
      if (!profile?.is_admin) throw new Error('Only admins can create hackathons')
      
      // No longer need to deactivate other hackathons as we now support multiple active hackathons
      
      // Create hackathon
      const { data: hackathonData, error: hackathonError } = await supabase
        .from('hackathons')
        .insert({
          title,
          description,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          registration_deadline: new Date(registrationDeadline).toISOString(),
          team_formation_deadline: new Date(teamFormationDeadline).toISOString(),
          submission_deadline: new Date(submissionDeadline).toISOString(),
          judging_start: new Date(judgingStart).toISOString(),
          judging_end: new Date(judgingEnd).toISOString(),
          max_team_size: parseInt(maxTeamSize),
          is_active: isActive
        })
        .select('id')
      
      if (hackathonError) throw new Error(hackathonError.message)
      
      // Add default judging criteria if hackathon was created successfully
      if (hackathonData && hackathonData.length > 0) {
        const hackathonId = hackathonData[0].id;
        await addDefaultCriteriaToHackathon(supabase, hackathonId);
      }
      
      // Redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch (error) {
      console.error('Error creating hackathon:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while creating the hackathon')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Hackathon</h1>
            <p className="mt-2 text-gray-600">
              Set up a new hackathon event with all required details
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Admin
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
                <h3 className="text-sm font-medium text-red-800">There was an error creating the hackathon</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Hackathon Title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      name="start-date"
                      id="start-date"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      name="end-date"
                      id="end-date"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="registration-deadline" className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      name="registration-deadline"
                      id="registration-deadline"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="team-formation-deadline" className="block text-sm font-medium text-gray-700 mb-1">Team Formation Deadline</label>
                    <input
                      type="datetime-local"
                      name="team-formation-deadline"
                      id="team-formation-deadline"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={teamFormationDeadline}
                      onChange={(e) => setTeamFormationDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="submission-deadline" className="block text-sm font-medium text-gray-700 mb-1">Submission Deadline</label>
                    <input
                      type="datetime-local"
                      name="submission-deadline"
                      id="submission-deadline"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={submissionDeadline}
                      onChange={(e) => setSubmissionDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="max-team-size" className="block text-sm font-medium text-gray-700 mb-1">Maximum Team Size</label>
                    <input
                      type="number"
                      name="max-team-size"
                      id="max-team-size"
                      min="1"
                      max="10"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="judging-start" className="block text-sm font-medium text-gray-700 mb-1">Judging Start</label>
                    <input
                      type="datetime-local"
                      name="judging-start"
                      id="judging-start"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={judgingStart}
                      onChange={(e) => setJudgingStart(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="judging-end" className="block text-sm font-medium text-gray-700 mb-1">Judging End</label>
                    <input
                      type="datetime-local"
                      name="judging-end"
                      id="judging-end"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={judgingEnd}
                      onChange={(e) => setJudgingEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1">Status</legend>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <input
                          id="active"
                          name="is-active"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="ml-3 text-sm text-gray-700">
                          Active Hackathon
                        </label>
                      </div>
                    </div>
                  </fieldset>
                  <p className="mt-2 text-xs text-gray-500">
                    If checked, this hackathon will be marked as active. Multiple hackathons can be active simultaneously.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Hackathon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}