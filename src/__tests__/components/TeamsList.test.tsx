import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import TeamsList from '@/components/teams/TeamsList';
import { createClient } from '@/lib/supabase/client';

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Create a reusable mock for the Supabase client
const createMockSupabaseClient = (options = {}) => {
  const { 
    getUserError = null, 
    pendingTeamsError = null, 
    approvedTeamsError = null 
  } = options;
  
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'current-user' } },
        error: getUserError
      })
    },
    from: jest.fn().mockImplementation((table) => {
      const isTeamMembers = table === 'team_members';
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((field, value) => {
              // If querying for pending requests (is_approved = false)
              if (isTeamMembers && field === 'is_approved' && value === false) {
                return Promise.resolve({
                  data: [{ team_id: 'team-2' }],
                  error: pendingTeamsError
                });
              }
              // If querying for approved teams (is_approved = true)
              if (isTeamMembers && field === 'is_approved' && value === true) {
                return Promise.resolve({
                  data: [{ team_id: 'team-1' }],
                  error: approvedTeamsError
                });
              }
              return Promise.resolve({ data: [], error: null });
            })
          })
        })
      };
    })
  };
};

// Mock the createClient function at the module level
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
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
    // Set up the default mock implementation
    (createClient as jest.Mock).mockImplementation(() => createMockSupabaseClient());
  });

  test('renders teams list correctly after loading state', async () => {
    render(<TeamsList teams={mockTeams} />);
    
    // Initially, it should show loading indicator
    expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading teams...')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('teams-loading')).not.toBeInTheDocument();
    });
    
    // Now check if team data is displayed
    await waitFor(() => {
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
  });

  test('displays empty state when no teams after loading', async () => {
    render(<TeamsList teams={[]} />);
    
    // Initially shows loading state
    expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('teams-loading')).not.toBeInTheDocument();
    });
    
    // Now check for empty state
    await waitFor(() => {
      expect(screen.getByTestId('no-teams-available')).toBeInTheDocument();
      expect(screen.getByText('No teams available')).toBeInTheDocument();
      expect(screen.getByText('Be the first to create a team for the hackathon.')).toBeInTheDocument();
      expect(screen.getByTestId('create-team-button')).toBeInTheDocument();
    });
  });

  test('shows pending request indicators for teams with pending requests', async () => {
    // Render with the default mock in place
    render(<TeamsList teams={mockTeams} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('teams-loading')).not.toBeInTheDocument();
    });
    
    // Now check for the team list to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('teams-list-container')).toBeInTheDocument();
    });
    
    // Verify both teams are rendered 
    const teamElements = screen.getAllByRole('listitem');
    expect(teamElements).toHaveLength(2);
    
    // Use the test IDs to check for pending indicators
    expect(screen.getByTestId('pending-request-badge')).toBeInTheDocument();
    expect(screen.getByTestId('awaiting-approval-badge')).toBeInTheDocument();
    
    // Check background colors instead of class names
    const team2Element = screen.getByTestId('team-team-2');
    expect(team2Element).toHaveClass('bg-yellow-50');
    
    // Team Alpha should have the member class (green background)
    const team1Element = screen.getByTestId('team-team-1');
    expect(team1Element).toHaveClass('bg-green-50');
    
    // Team Alpha should still show "You are a member"
    expect(screen.getByText('You are a member')).toBeInTheDocument();
  });
  
  test('displays error message when authentication fails', async () => {
    // Mock an authentication error
    (createClient as jest.Mock).mockImplementation(() => 
      createMockSupabaseClient({
        getUserError: { message: 'Authentication failed' }
      })
    );
    
    render(<TeamsList teams={mockTeams} />);
    
    // Initially shows loading state
    expect(screen.getByTestId('teams-loading')).toBeInTheDocument();
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('teams-error-message')).toBeInTheDocument();
      expect(screen.getByText('Error loading teams')).toBeInTheDocument();
      expect(screen.getByText('Authentication error: Authentication failed')).toBeInTheDocument();
    });
  });
});