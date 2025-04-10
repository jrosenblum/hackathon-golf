'use client'

import AuthHeader from '@/components/navigation/AuthHeader'
import Footer from '@/components/layout/Footer'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthHeader />
      <div className="flex-grow bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}