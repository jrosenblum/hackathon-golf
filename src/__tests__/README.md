# Testing Guidelines

This directory contains tests for the Hackathon Signup application. We use Jest and React Testing Library for both unit and integration testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized into the following directories:

- `components/`: Tests for React components
- `pages/`: Tests for Next.js pages and page components
- `utils/`: Tests for utility functions

## Test Patterns

We follow these patterns for different types of tests:

### Unit Tests

- Test individual functions and utilities in isolation
- Focus on input/output and edge cases
- Keep tests small and focused on one piece of functionality

Example: `auth.test.ts` tests the email domain validation functions.

### Component Tests

- Test React components in isolation
- Focus on rendering, user interactions, and component state
- Mock dependencies like Supabase client and Next.js router

Example: `Footer.test.tsx` tests the rendering of the Footer component.

### Integration Tests

- Test multiple components working together
- Test common user flows like logging in, joining a team, etc.
- Use more realistic mocks and simulate real user behavior

Example: `TeamDetail.test.tsx` tests the team details page including loading, error states, and interactions.

## Mocking

We use the following mocking strategies:

- **Supabase**: Mock the `createClient` function to return a mock client with test data
- **Next.js**: Mock `useRouter`, `useParams`, and other Next.js hooks
- **Components**: Mock layout components that aren't relevant to the test

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it's implemented
2. **Use realistic test data**: Use data structures that match the actual application data
3. **Test error states**: Make sure components handle errors gracefully
4. **Keep tests independent**: Each test should run in isolation
5. **Avoid testing third-party code**: Don't test the behavior of libraries like Supabase
6. **Write descriptive test names**: Use `describe` and `test` to create a clear hierarchy

## Adding New Tests

When adding new features, add corresponding tests:

1. For new utility functions, add unit tests in `utils/`
2. For new components, add component tests in `components/`
3. For new pages or complex interactions, add integration tests in `pages/`
4. For critical user flows, consider adding end-to-end tests using a tool like Cypress (not yet set up)

## Coverage

We aim for at least 70% test coverage across the codebase. Focus on testing:

1. Business logic
2. Error handling
3. User interactions
4. Edge cases

## Debugging Tests

If tests are failing, you can:

1. Use `console.log` in your tests to see values during execution
2. Use `screen.debug()` to see the current state of the rendered component
3. Set breakpoints in your IDE to step through test execution
4. Run a single test file with `npm test -- path/to/file.test.tsx`