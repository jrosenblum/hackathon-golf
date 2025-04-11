import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TeamsList from '@/components/teams/TeamsList';
import { createClient } from '@/lib/supabase/client';

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('TeamsList Component', () => {
  // Mock team data for testing
  const mockTeams = [
    {
      id: 'team-1',
      name: 'Team Alpha',
      description: 'This is Team Alpha',
      needed_skills: ['React', 'TypeScript'],
      looking_for_members: true,
      team_members: [
        { user_id: 'user-1', is_approved: true },
        { user_id: 'user-2', is_approved: true }
      ]
    },
    {
      id: 'team-2',
      name: 'Team Beta',
      description: 'This is Team Beta',
      needed_skills: ['Node.js', 'MongoDB'],
      looking_for_members: true,
      team_members: [
        { user_id: 'user-3', is_approved: true }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders teams list correctly', () => {
    render(<TeamsList teams={mockTeams} />);
    
    // Check if team names are displayed
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    
    // Check if team descriptions are displayed
    expect(screen.getByText('This is Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('This is Team Beta')).toBeInTheDocument();
    
    // Check if skills are displayed
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    
    // Check if member count is displayed
    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  test('displays empty state when no teams', () => {
    render(<TeamsList teams={[]} />);
    
    expect(screen.getByText('No teams available')).toBeInTheDocument();
    expect(screen.getByText('Be the first to create a team for the hackathon.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a Team' })).toBeInTheDocument();
  });

  test('shows pending request indicators for teams with pending requests', async () => {
    // Create a more direct mock specifically for this test
    jest.spyOn(require('@/lib/supabase/client'), 'createClient').mockImplementation(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'current-user' } }
        })
      },
      from: jest.fn().mockImplementation(() => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ team_id: 'team-2' }],
                error: null
              })
            })
          })
        };
      })
    }));
    
    // Render with the global mock in place
    render(<TeamsList teams={mockTeams} />);
    
    // Force the component to re-render with pending data
    // We need to manually update the component state since Jest doesn't
    // wait for all async operations in useEffect
    await waitFor(() => {
      // Look for the "Request Pending" text to appear
      expect(screen.queryByText('Request Pending')).toBeInTheDocument();
    });
    
    // Verify both teams are rendered 
    const teamElements = screen.getAllByRole('listitem');
    expect(teamElements).toHaveLength(2);
    
    // Use the test IDs to check for pending indicators
    expect(screen.getByTestId('pending-request-badge')).toBeInTheDocument();
    expect(screen.getByTestId('awaiting-approval-badge')).toBeInTheDocument();
    
    // Check that Team Beta has the pending class 
    expect(screen.getByTestId('team-team-2')).toHaveClass('team-pending-request');
    
    // Team Alpha should not have pending indicators
    expect(screen.getByTestId('team-team-1')).not.toHaveClass('team-pending-request');
    
    // Team Alpha should still show "Looking for members"
    expect(screen.getByText('Looking for members')).toBeInTheDocument();
  });
});