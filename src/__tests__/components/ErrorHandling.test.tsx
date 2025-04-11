import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TeamDetailPage from '@/app/teams/[id]/page';
import { createClient } from '@/lib/supabase/client';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  }),
  useParams: () => ({
    id: 'mock-team-id',
  }),
}));

// Mock MainLayout component
jest.mock('@/components/layout/MainLayout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>
  };
});

// Set global timeout for Jest
jest.setTimeout(15000);

describe('Error Handling in Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TeamDetailPage displays error message when team not found', async () => {
    // Mock Supabase to return error
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } } })
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'teams') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { message: 'Team not found' }
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        })
      }));
    
    render(<TeamDetailPage />);
    
    // Wait for error message to be displayed with increased timeout
    await waitFor(() => {
      expect(screen.getAllByText(/error/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Team not found/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Should show link to return to teams list
    expect(screen.getByRole('link', { name: /back to teams/i })).toBeInTheDocument();
  });

  test('TeamDetailPage displays error message when database query fails', async () => {
    // Mock Supabase to return server error
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } } })
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'teams') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockRejectedValue(new Error('Database connection error'))
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        })
      }));
    
    render(<TeamDetailPage />);
    
    // Wait for error message to be displayed with increased timeout
    await waitFor(() => {
      expect(screen.getAllByText(/error/i)[0]).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Should show error message and back link
    expect(screen.getByRole('link', { name: /back to teams/i })).toBeInTheDocument();
  });

  test('TeamDetailPage handles case when team members query fails', async () => {
    // Mock successful team query but members query fails
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } } })
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'teams') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: {
                      id: 'mock-team-id',
                      name: 'Mock Team',
                      description: 'Team description',
                      needed_skills: [],
                      looking_for_members: true,
                      created_at: '2023-01-01T00:00:00Z',
                      hackathons: { is_active: true }
                    }, 
                    error: null
                  })
                })
              })
            };
          } else if (table === 'team_members') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockImplementation(() => {
                  throw new Error('supabase.from(...).select(...).eq(...).single is not a function');
                })
              })
            };
          } else if (table === 'projects') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [], 
                    error: null
                  })
                })
              })
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        })
      }));
    
    render(<TeamDetailPage />);
    
    // Check for error message when members query fails
    await waitFor(() => {
      expect(screen.getAllByText(/error/i)[0]).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});