'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

type FAQ = {
  id: string
  question: string
  answer: string
  category: string | null
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export default function AdminFAQsPage() {
  const router = useRouter()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // For the new FAQ form
  const [isAddingFAQ, setIsAddingFAQ] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newOrderIndex, setNewOrderIndex] = useState(0)
  const [isPublished, setIsPublished] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // For editing FAQs
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (profileError || !profile?.is_admin) {
          router.push('/dashboard')
          return
        }
        
        setIsAdmin(true)
        loadFAQs()
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/login')
      }
    }
    
    checkAdmin()
  }, [router])
  
  const loadFAQs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })
      
      if (error) throw new Error('Failed to load FAQs')
      
      setFaqs(data || [])
    } catch (err) {
      console.error('Error loading FAQs:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while loading FAQs')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setFormError('Question and answer are required')
      return
    }
    
    try {
      setIsSubmitting(true)
      setFormError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('faqs')
        .insert({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          category: newCategory.trim() || null,
          order_index: newOrderIndex,
          is_published: isPublished
        })
        .select()
      
      if (error) throw new Error(`Error adding FAQ: ${error.message}`)
      
      // Reset form
      setNewQuestion('')
      setNewAnswer('')
      setNewCategory('')
      setNewOrderIndex(0)
      setIsPublished(true)
      setIsAddingFAQ(false)
      
      // Refresh FAQs list
      await loadFAQs()
      
      setSuccessMessage('FAQ added successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error adding FAQ:', err)
      setFormError(err instanceof Error ? err.message : 'An error occurred while adding the FAQ')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleUpdateFAQ = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingFAQ) return
    
    if (!editingFAQ.question.trim() || !editingFAQ.answer.trim()) {
      setFormError('Question and answer are required')
      return
    }
    
    try {
      setIsSubmitting(true)
      setFormError(null)
      
      const supabase = createClient()
      const { error } = await supabase
        .from('faqs')
        .update({
          question: editingFAQ.question.trim(),
          answer: editingFAQ.answer.trim(),
          category: editingFAQ.category?.trim() || null,
          order_index: editingFAQ.order_index,
          is_published: editingFAQ.is_published
        })
        .eq('id', editingFAQ.id)
      
      if (error) throw new Error(`Error updating FAQ: ${error.message}`)
      
      // Reset editing state
      setEditingFAQ(null)
      
      // Refresh FAQs list
      await loadFAQs()
      
      setSuccessMessage('FAQ updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error updating FAQ:', err)
      setFormError(err instanceof Error ? err.message : 'An error occurred while updating the FAQ')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const supabase = createClient()
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(`Error deleting FAQ: ${error.message}`)
      
      // Refresh FAQs list
      await loadFAQs()
      
      setSuccessMessage('FAQ deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error deleting FAQ:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the FAQ')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage FAQs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add, edit, or remove frequently asked questions that will be displayed to users.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin
            </Link>
            <button
              type="button"
              onClick={() => setIsAddingFAQ(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              disabled={isAddingFAQ}
            >
              Add New FAQ
            </button>
          </div>
        </div>
        
        {successMessage && (
          <div className="mb-6 bg-green-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Add FAQ Form */}
        {isAddingFAQ && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Add New FAQ</h2>
            </div>
            <form onSubmit={handleAddFAQ}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700">Question</label>
                  <input
                    type="text"
                    id="question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700">Answer</label>
                  <textarea
                    id="answer"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">You can use line breaks for formatting.</p>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category (optional)</label>
                  <input
                    type="text"
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    id="order"
                    value={newOrderIndex}
                    onChange={(e) => setNewOrderIndex(parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">FAQs are sorted by this value (lowest first).</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="published"
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="published" className="font-medium text-gray-700">Published</label>
                    <p className="text-gray-500">Only published FAQs are visible on the public FAQ page.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFAQ(false)
                    setFormError(null)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit FAQ Form */}
        {editingFAQ && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Edit FAQ</h2>
            </div>
            <form onSubmit={handleUpdateFAQ}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="edit-question" className="block text-sm font-medium text-gray-700">Question</label>
                  <input
                    type="text"
                    id="edit-question"
                    value={editingFAQ.question}
                    onChange={(e) => setEditingFAQ({...editingFAQ, question: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-answer" className="block text-sm font-medium text-gray-700">Answer</label>
                  <textarea
                    id="edit-answer"
                    value={editingFAQ.answer}
                    onChange={(e) => setEditingFAQ({...editingFAQ, answer: e.target.value})}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">You can use line breaks for formatting.</p>
                </div>
                
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category (optional)</label>
                  <input
                    type="text"
                    id="edit-category"
                    value={editingFAQ.category || ''}
                    onChange={(e) => setEditingFAQ({...editingFAQ, category: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-order" className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input
                    type="number"
                    id="edit-order"
                    value={editingFAQ.order_index}
                    onChange={(e) => setEditingFAQ({...editingFAQ, order_index: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">FAQs are sorted by this value (lowest first).</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="edit-published"
                      type="checkbox"
                      checked={editingFAQ.is_published}
                      onChange={(e) => setEditingFAQ({...editingFAQ, is_published: e.target.checked})}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="edit-published" className="font-medium text-gray-700">Published</label>
                    <p className="text-gray-500">Only published FAQs are visible on the public FAQ page.</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFAQ(null)
                    setFormError(null)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Update FAQ'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* FAQ List */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">FAQ List</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No FAQs found. Click "Add New FAQ" to create one.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="truncate max-w-xs">{faq.question}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {faq.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {faq.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {faq.order_index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {faq.is_published ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingFAQ(faq)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(faq.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}