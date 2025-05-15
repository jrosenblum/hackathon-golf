'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'

type FAQ = {
  id: string
  question: string
  answer: string
  category: string | null
  order_index: number
  is_published: boolean
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const supabase = createClient()
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true })
        
        if (error) {
          throw new Error('Failed to load FAQs')
        }
        
        setFaqs(data || [])
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            data
              ?.map(faq => faq.category)
              .filter(category => category !== null && category !== '') as string[]
          )
        )
        
        setCategories(uniqueCategories)
      } catch (err) {
        console.error('Error loading FAQs:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while loading FAQs')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFAQs()
  }, [])

  const filteredFaqs = selectedCategory
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading FAQs</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Filter by category:</span>
                  <button
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedCategory === null
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`px-3 py-1 text-sm rounded-full ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No FAQs found. Please check back later.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                      <div className="prose prose-blue max-w-none text-gray-700" 
                        dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br />') }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}