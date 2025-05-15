import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link 
              href="/faq" 
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              FAQ
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link 
              href="/terms" 
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Terms of Service
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Privacy Policy
            </Link>
          </div>
        </nav>
        <p className="mt-4 text-center text-sm text-gray-400">
          &copy; 2025 MH Sub I, LLC dba Internet Brands
        </p>
      </div>
    </footer>
  )
}