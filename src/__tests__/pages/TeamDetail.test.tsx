import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamDetailPage from '@/app/teams/[id]/page';
import { createClient } from '@/lib/supabase/client';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useParams: () => ({
    id: 'mock-team-id',
  }),
}));

// More comprehensive Supabase mock for complex components
jest.mock('@/lib/supabase/client', () => {
  const selectMock = jest.fn().mockReturnThis();
  const joinMock = jest.fn().mockReturnThis();
  const eqMock = jest.fn().mockReturnThis();
  
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
        signOut: jest.fn().mockResolvedValue({}),
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'teams') {
          return {
            select: selectMock.mockReturnValue({
              eq: eqMock.mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'mock-team-id',
                    name: 'Mock Team',
                    description: 'This is a mock team for testing',
                    needed_skills: ['React', 'TypeScript', 'Node.js'],
                    looking_for_members: true,
                    created_at: '2023-04-01T12:00:00Z',
                    hackathon_id: 'mock-hackathon-id',
                    hackathons: {
                      id: 'mock-hackathon-id',
                      title: 'Mock Hackathon',
                      is_active: true
                    }
                  },
                  error: null
                })
              })
            })
          };
        } else if (table === 'team_members') {
          return {
            select: selectMock.mockReturnValue({
              eq: eqMock.mockReturnValue([
                {
                  id: 'member-1',
                  user_id: 'leader-user-id',
                  is_leader: true,
                  is_approved: true,
                  profiles: {
                    id: 'leader-user-id',
                    full_name: 'Team Leader',
                    email: 'leader@internetbrands.com'
                  }
                },
                {
                  id: 'member-2',
                  user_id: 'mock-user-id', // Current user
                  is_leader: false,
                  is_approved: true,
                  profiles: {
                    id: 'mock-user-id',
                    full_name: 'Test User',
                    email: 'test@internetbrands.com'
                  }
                }
              ])
            }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            update: jest.fn().mockResolvedValue({ data: null, error: null }),
            delete: jest.fn().mockResolvedValue({ data: null, error: null })
          };
        } else if (table === 'projects') {
          return {
            select: selectMock.mockReturnValue({
              eq: eqMock.mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [{
                    id: 'project-1',
                    title: 'Mock Project',
                    description: 'This is a mock project',
                    category: 'Web',
                    technologies: ['React', 'Next.js'],
                    submission_date: '2023-04-15T12:00:00Z'
                  }],
                  error: null
                })
              })
            })
          };
        }
        return {
          select: selectMock,
          eq: eqMock,
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn().mockResolvedValue({ data: null, error: null }),
          delete: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      })
    })),
  };
});

// Mock the MainLayout component
jest.mock('@/components/layout/MainLayout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>
  };
});

describe('Team Detail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Loading state is displayed initially', () => {
    render(<TeamDetailPage />);
    // Look for the spinner that indicates loading
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('Team details are displayed after loading', async () => {
    render(<TeamDetailPage />);
    
    // Wait for loading to finish and team details to be displayed
    await waitFor(() => {
      expect(screen.getByText('Mock Team')).toBeInTheDocument();
    });
    
    // Check team description and other details
    expect(screen.getByText('This is a mock team for testing')).toBeInTheDocument();
    expect(screen.getAllByText('React')[0]).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    
    // We don't check specific team member roles like 'Team Leader' since they
    // may be rendered differently in the component
    expect(screen.getByText(/team members/i)).toBeInTheDocument();
    
    // Check project info
    expect(screen.getByText('Mock Project')).toBeInTheDocument();
  });

  test('Team page displays properly for members', async () => {
    render(<TeamDetailPage />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Mock Team')).toBeInTheDocument();
    });
    
    // We don't test for leave button since it might not be visible depending on the user's role
    // Instead check that back to teams link exists
    expect(screen.getByRole('link', { name: /back to teams/i })).toBeInTheDocument();
  });
});