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

describe('Error Handling in Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TeamDetailPage displays error message when team not found', async () => {
    // Mock Supabase to return error
    const mockSupabase = createClient();
    mockSupabase.from().select().eq().single.mockResolvedValue({ 
      data: null, 
      error: { message: 'Team not found' }
    });
    
    render(<TeamDetailPage />);
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/Team not found/i)).toBeInTheDocument();
    });
    
    // Should show link to return to teams list
    expect(screen.getByRole('link', { name: /back to teams/i })).toBeInTheDocument();
  });

  test('TeamDetailPage displays error message when database query fails', async () => {
    // Mock Supabase to return server error
    const mockSupabase = createClient();
    mockSupabase.from().select().eq().single.mockRejectedValue(
      new Error('Database connection error')
    );
    
    render(<TeamDetailPage />);
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    // Should show error message and back link
    expect(screen.getByRole('link', { name: /back to teams/i })).toBeInTheDocument();
  });

  test('TeamDetailPage handles case when team members query fails', async () => {
    // Mock successful team query
    const mockSupabase = createClient();
    mockSupabase.from().select().eq().single.mockResolvedValue({ 
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
    });
    
    // But members query fails
    mockSupabase.from().select().eq.mockImplementation((field) => {
      if (field === 'team_id') {
        return {
          data: null,
          error: { message: 'Failed to fetch team members' }
        };
      }
      return mockSupabase.from().select().eq;
    });
    
    render(<TeamDetailPage />);
    
    // Should still render team details even if members query fails
    await waitFor(() => {
      expect(screen.getByText('Mock Team')).toBeInTheDocument();
    });
  });
});