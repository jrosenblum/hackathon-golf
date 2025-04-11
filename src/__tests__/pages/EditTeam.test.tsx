import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditTeamPage from '@/app/teams/[id]/edit/page';
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
    prefetch: jest.fn(),
    pathname: '/teams/mock-team-id/edit',
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

describe('Edit Team Page', () => {
  // Mock team data for testing
  const mockTeam = {
    id: 'mock-team-id',
    name: 'Original Team Name',
    description: 'Original team description',
    needed_skills: ['JavaScript', 'React'],
    looking_for_members: true,
    hackathon_id: 'mock-hackathon-id',
    hackathons: {
      id: 'mock-hackathon-id',
      title: 'Hackathon 2025',
      is_active: true
    }
  };

  // Mock team membership for current user (as leader)
  const mockMembership = {
    is_leader: true
  };
  
  // Mock auth user
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the Supabase mock with specific behavior for this test
    let mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Mock team retrieval
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      // For team details query
      if (selection?.includes('hackathons') || selection?.includes('name')) {
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: mockTeam, 
              error: null 
            })
          })
        };
      } 
      // For team membership query
      else {
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ 
                  data: mockMembership, 
                  error: null 
                })
              })
            })
          })
        };
      }
    });
    
    // Mock team update
    jest.spyOn(mockFromObj, 'update').mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    });
  });

  test('loads and displays team data for editing', async () => {
    // Set up mock with proper team membership check
    let mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Mock team_members query to consistently return a leader
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      if (selection === 'is_leader') {
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { is_leader: true },
                  error: null
                })
              })
            })
          })
        };
      }
      // For other queries, use the default mock behavior
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTeam,
            error: null
          })
        })
      };
    });
    
    render(<EditTeamPage />);
    
    // Initially should show loading state
    expect(screen.getByText(/loading team details/i)).toBeInTheDocument();
    
    // After loading, should show form with team data
    await waitFor(() => {
      expect(screen.getByText(/edit team/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Form fields should be pre-populated with team data
    expect(screen.getByText('Hackathon 2025')).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText(/team name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Original Team Name');
    
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe('Original team description');
    
    // Skills should be displayed
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    
    // Looking for members checkbox should be checked
    const checkbox = screen.getByLabelText(/looking for members/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test('allows editing team fields and submits changes', async () => {
    // Set up mock with proper team membership check
    let mockSupabase = createClient();
    const mockFromObj = mockSupabase.from() as any;
    
    // Mock team_members query to consistently return a leader
    jest.spyOn(mockFromObj, 'select').mockImplementation((selection) => {
      if (selection === 'is_leader') {
        return {
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { is_leader: true },
                  error: null
                })
              })
            })
          })
        };
      }
      // For other queries, use the default mock behavior
      return {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTeam,
            error: null
          })
        })
      };
    });
    
    render(<EditTeamPage />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText(/edit team/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Update form fields
    const nameInput = screen.getByLabelText(/team name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Updated Team Name' } });
    
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    fireEvent.change(descriptionInput, { target: { value: 'Updated team description' } });
    
    // Add a new skill
    const skillInput = screen.getByLabelText(/skills/i) as HTMLInputElement;
    fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    
    // Toggle "looking for members" checkbox
    const checkbox = screen.getByLabelText(/looking for members/i) as HTMLInputElement;
    fireEvent.click(checkbox);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update team/i }));
    
    // Check that Supabase update was called with the correct data
    await waitFor(() => {
      const supabase = createClient();
      expect(supabase.from).toHaveBeenCalledWith('teams');
      expect(supabase.from().update).toHaveBeenCalledWith({
        name: 'Updated Team Name',
        description: 'Updated team description',
        needed_skills: expect.arrayContaining(['JavaScript', 'React', 'TypeScript']),
        looking_for_members: false
      });
    });
  });

  test('shows error message when user is not a team leader', async () => {
    // Mock a specific setup for this test
    jest.spyOn(require('@/lib/supabase/client'), 'createClient')
      .mockImplementation(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({ 
            data: { user: mockUser }
          })
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'teams') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockTeam, 
                    error: null 
                  })
                })
              })
            };
          } 
          else if (table === 'team_members') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({ 
                        data: { is_leader: false },  // Non-leader
                        error: null 
                      })
                    })
                  })
                })
              })
            };
          }
          // Default for other tables
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        })
      }));
    
    render(<EditTeamPage />);
    
    // Should show loading initially
    expect(screen.getByText(/loading team details/i)).toBeInTheDocument();
    
    // Then check for error message with longer timeout
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Edit form should not be displayed
    expect(screen.queryByLabelText(/team name/i)).not.toBeInTheDocument();
  });
});