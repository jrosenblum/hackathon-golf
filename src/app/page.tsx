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
                  <span className="text-2xl font-bold text-blue-600">Hackathon Platform</span>
                </div>
              </div>
              <div className="hidden md:flex md:space-x-10">
                <a href="#features" className="font-medium text-gray-500 hover:text-gray-900">
                  Features
                </a>
                <a href="#timeline" className="font-medium text-gray-500 hover:text-gray-900">
                  Timeline
                </a>
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
                <span className="block">Company Hackathon</span>
                <span className="block text-blue-600">Showcase Your Innovation</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Join the company-wide hackathon to collaborate, innovate, and bring your ideas to life. 
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
                    href="#timeline"
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

      {/* Features */}
      <div id="features" className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for a successful hackathon
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform provides all the tools and features to make your hackathon experience smooth and productive.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Team Formation</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Create or join teams based on skills and interests. Find the perfect teammates for your project.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Project Submission</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Submit your projects with descriptions, links, and demonstration videos. Showcase your innovation.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Judging System</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Transparent judging process with clear criteria and feedback. Get insights into how your project performed.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Notifications</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Stay updated with important deadlines, team requests, and results. Never miss critical information.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div id="timeline" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Timeline</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              Key Dates and Deadlines
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Mark your calendar with these important milestones for the upcoming hackathon.
            </p>
          </div>

          <div className="mt-10">
            <div className="flow-root">
              <ul className="-mb-8">
                <li className="relative pb-8">
                  <div className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <div className="text-lg text-gray-900 font-medium">Registration Opens</div>
                      <div className="text-base text-gray-500">September 15, 2023</div>
                      <p className="mt-1 text-sm text-gray-500">Sign up to participate in the hackathon.</p>
                    </div>
                  </div>
                </li>

                <li className="relative pb-8">
                  <div className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <div className="text-lg text-gray-900 font-medium">Team Formation Deadline</div>
                      <div className="text-base text-gray-500">October 5, 2023</div>
                      <p className="mt-1 text-sm text-gray-500">All teams must be finalized by this date.</p>
                    </div>
                  </div>
                </li>

                <li className="relative pb-8">
                  <div className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></div>
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <div className="text-lg text-gray-900 font-medium">Hackathon Begins</div>
                      <div className="text-base text-gray-500">October 15, 2023</div>
                      <p className="mt-1 text-sm text-gray-500">Coding and development officially starts.</p>
                    </div>
                  </div>
                </li>

                <li className="relative">
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <div className="text-lg text-gray-900 font-medium">Project Submission Deadline</div>
                      <div className="text-base text-gray-500">October 20, 2023</div>
                      <p className="mt-1 text-sm text-gray-500">All projects must be submitted by this deadline.</p>
                    </div>
                  </div>
                </li>
              </ul>
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
                <dt className="text-lg leading-6 font-medium text-gray-900">What's the maximum team size?</dt>
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
                <dt className="text-lg leading-6 font-medium text-gray-900">What if I don't have a team?</dt>
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
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Privacy Policy
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2023 Company Hackathon. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}