# Hackathon Signup Platform

A web application for managing company hackathons, allowing employees to register, create or join teams, submit projects, and enabling judges to rate submissions.

## Features

- **Authentication**: Google OAuth login for company employees
- **User Management**: User profiles with skills and interests
- **Team Formation**: Create or join teams, specify required skills
- **Project Submission**: Submit and update project details, upload demonstrations
- **Judging System**: Score projects based on defined criteria
- **Admin Dashboard**: Manage hackathon parameters, users, and judging

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for video uploads

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hackathon-signup.git
   cd hackathon-signup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and update with your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update the `.env.local` file with your Supabase URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Initialize your Supabase database with the schema:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy the contents of `src/lib/supabase/schema.sql`
   - Run the SQL to set up your database schema

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred hosting platform (Vercel recommended for Next.js apps)

## Project Structure

```
hackathon-signup/
├── docs/               # Documentation files
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── admin/      # Admin dashboard pages
│   │   ├── auth/       # Authentication routes
│   │   ├── dashboard/  # User dashboard
│   │   ├── login/      # Login page
│   │   ├── projects/   # Project pages
│   │   ├── teams/      # Team management pages
│   │   ├── globals.css # Global styles
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Homepage
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   └── navigation/ # Navigation components
│   └── lib/            # Utility functions
│       └── supabase/   # Supabase client configuration
├── .env.local.example  # Example environment variables
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Supabase for providing a robust backend solution
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework