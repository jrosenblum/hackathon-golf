import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Hackathon Platform</h2>
          <p className="mt-2 text-gray-600">
            Sign in to participate in the Internet Brands Hackathon
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need help?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                If you&apos;re having trouble signing in, please contact the hackathon organizers at{' '}
                <a href="mailto:hackathon@internetbrands.com" className="font-medium text-blue-600 hover:text-blue-500">
                  hackathon@internetbrands.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}