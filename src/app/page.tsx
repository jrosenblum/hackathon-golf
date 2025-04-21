import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 h-full w-full" aria-hidden="true">
          <div className="relative h-full">
            <svg
              className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-full"
              width={404}
              height={784}
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
                  x={0}
                  y={0}
                  width={20}
                  height={20}
                  patternUnits="userSpaceOnUse"
                >
                  <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width={404} height={784} fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)" />
            </svg>
            <svg
              className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:-translate-x-1/2 md:-translate-y-1/2 lg:-translate-x-3/4"
              width={404}
              height={784}
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="d2a68204-c383-44b1-b99f-42ccff4e5365"
                  x={0}
                  y={0}
                  width={20}
                  height={20}
                  patternUnits="userSpaceOnUse"
                >
                  <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />
                </pattern>
              </defs>
              <rect width={404} height={784} fill="url(#d2a68204-c383-44b1-b99f-42ccff4e5365)" />
            </svg>
          </div>
        </div>

        <div className="relative pt-6 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="relative flex items-center justify-between sm:h-10 md:justify-center" aria-label="Global">
              <div className="flex items-center flex-1 md:absolute md:inset-y-0 md:left-0">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <div className="flex items-center">
                    <img src="/logo.png" alt="Hackathon Platform Logo" className="h-24 w-auto" />
                  </div>
                </div>
              </div>
              <div className="hidden md:flex md:space-x-10">
                <a href="#faq" className="font-medium text-gray-500 hover:text-gray-900">
                  FAQ
                </a>
              </div>
              <div className="hidden md:absolute md:flex md:items-center md:justify-end md:inset-y-0 md:right-0">
                <span className="inline-flex rounded-md shadow">
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                  >
                    Log in
                  </Link>
                </span>
              </div>
            </nav>
          </div>

          <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Internet Brands Hackathon</span>
                <span className="block text-blue-600">Showcase Your Innovation</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Join the Internet Brands company-wide hackathon to collaborate, innovate, and bring your ideas to life. 
                Form teams, build projects, and compete for prizes.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <a
                    href="#faq"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">FAQ</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Get answers to the most common questions about our hackathon.
            </p>
          </div>

          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">Who can participate?</dt>
                <dd className="text-base text-gray-500">
                  All company employees are eligible to participate in the hackathon. You can join as an individual or as part of a team.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">What&apos;s the maximum team size?</dt>
                <dd className="text-base text-gray-500">
                  Teams can have up to 5 members. We encourage diverse teams with a mix of skills and experiences.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">What kind of projects can we build?</dt>
                <dd className="text-base text-gray-500">
                  Projects can range from software applications to hardware integrations. They should address a real problem or opportunity within the company or beyond.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">How are projects judged?</dt>
                <dd className="text-base text-gray-500">
                  Projects will be evaluated based on innovation, technical implementation, business potential, and presentation quality.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">What if I don&apos;t have a team?</dt>
                <dd className="text-base text-gray-500">
                  You can use our platform to find teammates based on skills and interests, or join an existing team looking for additional members.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="text-lg leading-6 font-medium text-gray-900">Are there prizes?</dt>
                <dd className="text-base text-gray-500">
                  Yes! There will be prizes for the top projects, category winners, and special recognition awards. Details will be announced soon.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to innovate?</span>
            <span className="block">Join the hackathon today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Showcase your skills, collaborate with colleagues, and bring your ideas to life.
          </p>
          <Link
            href="/login"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 sm:w-auto"
          >
            Register Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Rules
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Contact
              </a>
            </div>
            <div className="px-5 py-2">
              <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 MH Sub I, LLC dba Internet Brands
          </p>
        </div>
      </footer>
    </div>
  )
}
