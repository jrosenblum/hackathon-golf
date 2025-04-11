import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '@/components/navigation/Header';
import { createClient } from '@/lib/supabase/client';

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Create a reusable mock for Supabase
function createMockSupabaseClient(options = {}) {
  const {
    isAdmin = false,
    isJudge = false,
    pendingRequests = 0
  } = options;
  
  // Create team members data based on options
  const teamMembersData = [];
  for (let i = 0; i < pendingRequests; i++) {
    teamMembersData.push({ id: `request-${i+1}` });
  }
  
  // Create judges data based on options
  const judgesData = isJudge ? [{ id: 'judge-1' }] : [];
  
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'mock-user-id' } } 
      }),
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { is_admin },
                error: null
              })
            })
          })
        }
      }
      if (table === 'judges') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: judgesData,
                  error: null
                })
              })
            })
          })
        }
      }
      if (table === 'team_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: teamMembersData,
                error: null
              })
            })
          })
        }
      }
      
      // Default behavior for other tables
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis()
    }),
    removeChannel: jest.fn()
  };
}

describe('Header Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@internetbrands.com',
    user_metadata: {
      full_name: 'Test User'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document.addEventListener for click outside handler
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
    
    // Set up default Supabase mock
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => createMockSupabaseClient());
  });

  test('renders header with navigation links', () => {
    render(<Header user={mockUser} />);
    
    // Check navigation links
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
  });

  test('shows user information in the user menu', () => {
    render(<Header user={mockUser} />);
    
    // Check user info is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('shows notification badge when there are pending team requests', async () => {
    // Override default mock to include 2 pending requests
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => createMockSupabaseClient({ pendingRequests: 2 }));
        
    render(<Header user={mockUser} />);
    
    // Wait for pending requests badge to appear
    await waitFor(() => {
      expect(screen.getByTestId('pending-requests-badge')).toBeInTheDocument();
    });
    
    // Verify badge content and properties
    const badge = screen.getByTestId('pending-requests-badge');
    expect(badge).toHaveTextContent('2');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  test('does not show notification badge when there are no pending team requests', async () => {
    // Use default mock which has 0 pending requests
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => createMockSupabaseClient({ pendingRequests: 0 }));
    
    render(<Header user={mockUser} />);
    
    // No need to wait, we're just checking presence of elements
    // The Teams link should exist
    expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument();
    
    // Verify no badge is present
    expect(screen.queryByTestId('pending-requests-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  test('shows admin link for admin users', async () => {
    // Override default mock for admin user
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => createMockSupabaseClient({ isAdmin: true, pendingRequests: 0 }));
    
    render(<Header user={mockUser} />);
    
    // Wait for admin link to appear
    await waitFor(() => {
      expect(screen.getByTestId('admin-link')).toBeInTheDocument();
    });
    
    // Verify content
    expect(screen.getByTestId('admin-link')).toHaveTextContent('Admin');
  });

  test('shows judging link for judges', async () => {
    // Override default mock for judge user
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => createMockSupabaseClient({ isJudge: true, pendingRequests: 0 }));
    
    render(<Header user={mockUser} />);
    
    // Wait for judging link to appear
    await waitFor(() => {
      expect(screen.getByTestId('judging-link')).toBeInTheDocument();
    });
    
    // Verify content
    expect(screen.getByTestId('judging-link')).toHaveTextContent('Judging');
  });
});