// Import jest-dom utilities
import '@testing-library/jest-dom';

// Suppress act() warnings and error logging during tests
const originalError = console.error;
console.error = (...args) => {
  // Suppress React act() warnings
  if (args[0] && typeof args[0] === 'string') {
    // Skip act() warnings
    if (args[0].includes('Warning: An update to') && 
        args[0].includes('inside a test was not wrapped in act(...)')) {
      return;
    }
    
    // Skip expected errors during testing
    if (args[0].includes('Error fetching team data:') || 
        args[0].includes('Error checking judge status:') ||
        args[0].includes('Error checking admin status:') ||
        args[0].includes('Error checking pending team requests:')) {
      return;
    }
  }
  
  // Pass other errors through
  originalError(...args);
};

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
  }),
  useParams: () => ({
    id: 'mock-id',
  }),
  usePathname: () => '/',
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => {
  // Create mock functions that can be chained
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockJoin = jest.fn().mockReturnThis();
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    delete: jest.fn().mockResolvedValue({ data: [], error: null }),
    eq: mockEq,
    order: jest.fn().mockReturnThis(),
    limit: mockLimit,
    single: mockSingle,
    maybeSingle: mockMaybeSingle
  }));
  
  // Set up chain
  mockSelect.mockReturnValue({
    eq: mockEq,
    join: mockJoin
  });
  
  mockEq.mockReturnValue({
    eq: mockEq,
    limit: mockLimit,
    maybeSingle: mockMaybeSingle,
    single: mockSingle
  });
  
  // Make sure eq can be chained multiple times
  mockEq.mockImplementation(() => ({
    eq: mockEq,
    limit: mockLimit,
    maybeSingle: mockMaybeSingle,
    single: mockSingle
  }));
  
  mockLimit.mockResolvedValue({ data: [], error: null });
  
  return {
    createClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { 
            user: { 
              id: 'mock-user-id',
              email: 'test@internetbrands.com',
              user_metadata: { full_name: 'Test User' }
            } 
          } 
        }),
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: 'mock-user-id',
                email: 'test@internetbrands.com',
              }
            }
          }
        }),
        signOut: jest.fn().mockResolvedValue({}),
        signInWithPassword: jest.fn().mockResolvedValue({}),
        signInWithOAuth: jest.fn().mockResolvedValue({}),
        signUp: jest.fn().mockResolvedValue({}),
      },
      from: mockFrom,
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis()
      }),
      removeChannel: jest.fn()
    })),
  };
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});