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
    
    // Setup mock implementation for all Supabase calls
    const mockSupabase = createClient();
    
    // Mock profiles query for admin check
    const mockFromObj = mockSupabase.from() as any;
    jest.spyOn(mockFromObj, 'select').mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { is_admin: false },
          error: null
        })
      })
    });
    
    // Mock judges query for judge check
    const mockJudgesEq = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });
    
    // Mock team members query for pending requests check
    const mockTeamMembersEq = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    });
    
    // Override selectSpy with conditional behavior 
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      if (selection?.includes('is_admin')) {
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null
            })
          })
        };
      } else if (selection?.includes('hackathon_id')) {
        return { eq: mockJudgesEq };
      } else {
        return { eq: mockTeamMembersEq };
      }
    });
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
    // Mock pending team requests
    const mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Create a new implementation for the pending requests case
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      // Handle team_members table query for pending requests
      if (!selection || !selection.includes('is_admin')) {
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { id: 'request-1' },
                { id: 'request-2' }
              ],
              error: null
            })
          })
        };
      } else if (selection.includes('is_admin')) {
        // Handle admin check
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null
            })
          })
        };
      } else {
        // Handle other cases
        return {
          eq: jest.fn().mockReturnThis(),
        };
      }
    });
    
    render(<Header user={mockUser} />);
    
    // Wait for pending requests to be fetched - look for the badge text
    await waitFor(() => {
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
    
    // Verify badge styling
    const badge = screen.getByText('2');
    expect(badge.closest('.ml-2')).toHaveClass('bg-yellow-100');
  });

  test('does not show notification badge when there are no pending team requests', async () => {
    render(<Header user={mockUser} />);
    
    // Wait for pending requests to be fetched (mock returns empty array)
    await waitFor(() => {
      // Should not find a notification badge
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  test('shows admin link for admin users', async () => {
    // Mock admin user
    const mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Update the mock to return admin: true
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      if (selection?.includes('is_admin')) {
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_admin: true }, // Set this to true
              error: null
            })
          })
        };
      } else {
        return {
          eq: jest.fn().mockReturnThis(),
        };
      }
    });
    
    render(<Header user={mockUser} />);
    
    // Wait for admin status to be checked
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    });
  });

  test('shows judging link for judges', async () => {
    // Mock judge user
    const mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Update the mock for judges query
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      if (selection?.includes('hackathon_id')) {
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: 'judge-1' }], // Return judge data
                  error: null
                })
              })
            })
          })
        };
      } else if (selection?.includes('is_admin')) {
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null
            })
          })
        };
      } else {
        return {
          eq: jest.fn().mockReturnThis(),
        };
      }
    });
    
    render(<Header user={mockUser} />);
    
    // Wait for judge status to be checked
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /judging/i })).toBeInTheDocument();
    });
  });
});