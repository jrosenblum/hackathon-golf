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