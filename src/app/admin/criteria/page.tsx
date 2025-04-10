'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { DEFAULT_JUDGING_CRITERIA } from '@/lib/judging'

export default function JudgingCriteriaPage() {
  const router = useRouter()
  const [criteria, setCriteria] = useState<any[]>([])
  const [hackathons, setHackathons] = useState<any[]>([])
  const [selectedHackathon, setSelectedHackathon] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [weight, setWeight] = useState(1)
  const [maxScore, setMaxScore] = useState(10)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Load hackathons and criteria when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Fetch active hackathons
        const { data: hackathonData, error: hackathonError } = await supabase
          .from('hackathons')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (hackathonError) throw new Error('Error fetching hackathons')
        setHackathons(hackathonData || [])
        
        // Set default selected hackathon to the first one
        if (hackathonData && hackathonData.length > 0) {
          setSelectedHackathon(hackathonData[0].id)
          await fetchCriteria(hackathonData[0].id)
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Fetch criteria for a specific hackathon
  const fetchCriteria = async (hackathonId: string) => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('judging_criteria')
        .select('*')
        .eq('hackathon_id', hackathonId)
        .order('weight', { ascending: false })
      
      if (error) throw new Error('Error fetching judging criteria')
      setCriteria(data || [])
      
    } catch (error) {
      console.error('Error fetching criteria:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while fetching criteria')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle hackathon change
  const handleHackathonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hackathonId = e.target.value
    setSelectedHackathon(hackathonId)
    await fetchCriteria(hackathonId)
    resetForm()
  }
  
  // Reset form fields
  const resetForm = () => {
    setName('')
    setDescription('')
    setWeight(1)
    setMaxScore(10)
    setEditingId(null)
  }
  
  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHackathon) {
      setError('Please select a hackathon')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      if (editingId) {
        // Update existing criteria
        const { error } = await supabase
          .from('judging_criteria')
          .update({
            name,
            description,
            weight,
            max_score: maxScore
          })
          .eq('id', editingId)
        
        if (error) throw new Error(error.message)
        setSuccessMessage('Criteria updated successfully')
      } else {
        // Create new criteria
        const { error } = await supabase
          .from('judging_criteria')
          .insert({
            hackathon_id: selectedHackathon,
            name,
            description,
            weight,
            max_score: maxScore
          })
        
        if (error) throw new Error(error.message)
        setSuccessMessage('Criteria added successfully')
      }
      
      // Refresh criteria list
      await fetchCriteria(selectedHackathon)
      resetForm()
      
    } catch (error) {
      console.error('Error saving criteria:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while saving the criteria')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Edit an existing criteria
  const handleEdit = (criterion: any) => {
    setName(criterion.name)
    setDescription(criterion.description || '')
    setWeight(criterion.weight)
    setMaxScore(criterion.max_score)
    setEditingId(criterion.id)
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Delete a criteria
  const handleDelete = async (criterionId: string) => {
    if (!confirm('Are you sure you want to delete this judging criteria? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      const { error } = await supabase
        .from('judging_criteria')
        .delete()
        .eq('id', criterionId)
      
      if (error) throw new Error(error.message)
      
      // Refresh criteria list
      await fetchCriteria(selectedHackathon)
      setSuccessMessage('Criteria deleted successfully')
      
    } catch (error) {
      console.error('Error deleting criteria:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while deleting the criteria')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Calculate total weight
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0)
  
  // Check if any default criteria are missing
  const hasAllDefaultCriteria = DEFAULT_JUDGING_CRITERIA.every(defaultCriterion => 
    criteria.some(c => c.name === defaultCriterion.name && c.description === defaultCriterion.description)
  )
  
  // Add missing default criteria
  const handleRestoreDefaults = async () => {
    if (!selectedHackathon) {
      setError('Please select a hackathon')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)
      
      const supabase = createClient()
      
      // Find which default criteria are missing
      const missingCriteria = DEFAULT_JUDGING_CRITERIA.filter(defaultCriterion => 
        !criteria.some(c => c.name === defaultCriterion.name && c.description === defaultCriterion.description)
      )
      
      if (missingCriteria.length === 0) {
        setSuccessMessage('All default criteria are already present')
        return
      }
      
      // Prepare criteria objects with hackathon ID
      const criteriaToInsert = missingCriteria.map(criterion => ({
        ...criterion,
        hackathon_id: selectedHackathon
      }))
      
      // Insert missing criteria
      const { error: insertError } = await supabase
        .from('judging_criteria')
        .insert(criteriaToInsert)
      
      if (insertError) throw new Error(insertError.message)
      
      // Refresh criteria list
      await fetchCriteria(selectedHackathon)
      setSuccessMessage('Default criteria restored successfully')
      
    } catch (error) {
      console.error('Error restoring default criteria:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while restoring default criteria')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Judging Criteria</h1>
            <p className="mt-2 text-gray-600">
              Define and customize judging criteria for each hackathon
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin
            </Link>
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-lg bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Hackathon Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Hackathon</h2>
          <div className="max-w-md">
            <label htmlFor="hackathon-select" className="block text-sm font-medium text-gray-700 mb-1">
              Hackathon
            </label>
            <select
              id="hackathon-select"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={selectedHackathon}
              onChange={handleHackathonChange}
              disabled={isLoading}
            >
              {hackathons.length === 0 && <option value="">No hackathons available</option>}
              {hackathons.map((hackathon) => (
                <option key={hackathon.id} value={hackathon.id}>
                  {hackathon.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Add/Edit Criteria Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Criteria' : 'Add New Criteria'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Criteria Name
              </label>
              <input
                type="text"
                id="name"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="e.g., Innovation, Technical Implementation"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                placeholder="Explain what judges should consider when scoring this criteria"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  id="weight"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min="1"
                  max="10"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Higher weight means this criteria is more important in the final score
                </p>
              </div>
              
              <div>
                <label htmlFor="max-score" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Score
                </label>
                <input
                  type="number"
                  id="max-score"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  The maximum score judges can give for this criteria (typically 10)
                </p>
              </div>
            </div>
            
            <div className="pt-2 flex space-x-3">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update Criteria' : 'Add Criteria'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Criteria List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Current Judging Criteria</h2>
            <div className="flex items-center gap-3">
              {!hasAllDefaultCriteria && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Restore Defaults
                </button>
              )}
              {totalWeight > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Total Weight: {totalWeight}
                </span>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-6 text-center">
              <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">Loading criteria...</p>
            </div>
          ) : criteria.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Criteria Defined</h3>
              <p className="mt-1 text-gray-500">Add judging criteria using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criteria
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Score
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {criteria.map((criterion) => (
                    <tr key={criterion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{criterion.name}</div>
                        {DEFAULT_JUDGING_CRITERIA.some(c => c.name === criterion.name && c.description === criterion.description) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Default
                          </span>
                        )}
                      </div>
                      {criterion.description && (
                        <div className="text-sm text-gray-500 mt-1">{criterion.description}</div>
                      )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {criterion.weight}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {criterion.max_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(criterion)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(criterion.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        {DEFAULT_JUDGING_CRITERIA.some(c => c.name === criterion.name && c.description === criterion.description) && (
                          <div className="text-xs text-gray-500 mt-1">You can edit or delete default criteria</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}