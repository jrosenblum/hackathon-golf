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
    // Create a custom response for this test case
    const mockSupabase = createClient();
    
    // Mock auth to return current-user
    const getUserSpy = jest.spyOn(mockSupabase.auth, 'getUser');
    getUserSpy.mockResolvedValue({
      data: { user: { id: 'current-user' } },
    });
    
    // Setup the pending team requests mock response
    const mockFromObj = mockSupabase.from() as any;
    const mockSelectObj = mockFromObj.select() as any;
    const mockEqObj = mockSelectObj.eq() as any;
    
    // Set the mock response for the pending requests query
    jest.spyOn(mockEqObj, 'eq').mockResolvedValue({
      data: [{ team_id: 'team-2' }],
      error: null
    });

    render(<TeamsList teams={mockTeams} />);
    
    // Wait for pending requests to be fetched
    await waitFor(() => {
      // Should highlight Team Beta with pending status
      const teamElements = screen.getAllByRole('listitem');
      expect(teamElements[1]).toHaveClass('bg-yellow-50');
    });
    
    // Should show pending request badge on Team Beta
    expect(screen.getByText('Request Pending')).toBeInTheDocument();
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    
    // Team Alpha should not have pending request indicator
    expect(screen.getByText('Looking for members')).toBeInTheDocument();
  });
});