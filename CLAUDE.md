# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
```bash
# Development
npm run dev                       # Start development server
npm run build                     # Build for production
npm run start                     # Start production server
npm run lint                      # Run ESLint
npm run typecheck                 # TypeScript type check

# Testing
npm test                          # Run all tests
npm test -- path/to/file.test.tsx # Run single test file
npm run test:watch                # Run tests in watch mode
npm run test:coverage             # Run tests with coverage
```

## Code Style Guidelines
- Use TypeScript with explicit types; strict mode enabled
- Use Next.js App Router architecture (src/app/ structure)
- Use functional React components with hooks
- Component files/directories use PascalCase, other files use camelCase
- Use path aliases with '@/' for src directory imports
- Order imports: React/hooks, Next.js, third-party, local components/utils
- Error handling with try/catch blocks and explicit error types
- Components organized by feature in src/components/[feature]/
- Tests should focus on behavior rather than implementation
- Mock external dependencies (Supabase, Next.js router) in tests
- Target 70% test coverage for critical paths

## Security Guidelines
- Never use NEXT_PUBLIC_* variables for sensitive operations
- For admin operations, always use the server-side API routes in /api/admin/
- Admin operations should use the secure admin client from @/lib/supabase/admin
- The admin client requires SUPABASE_SERVICE_ROLE_KEY in server-side environment variables
- Double-check permissions with server-side validation before sensitive operations
- Client components should never directly update admin settings in the database