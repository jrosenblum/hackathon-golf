import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/components/auth/LoginForm';
import { createClient } from '@/lib/supabase/client';
import { isAllowedEmailDomain } from '@/lib/auth';

// Mock the isAllowedEmailDomain function
jest.mock('@/lib/auth', () => ({
  isAllowedEmailDomain: jest.fn(),
  ALLOWED_EMAIL_DOMAINS: ['internetbrands.com', 'webmd.com', 'medscape.com'],
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Mock window.location.search
    Object.defineProperty(window, 'location', { 
      value: { search: '', href: 'http://localhost:3000/login' },
      writable: true
    });
  });

  test('renders login form with email and password fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('displays unauthorized domain error when URL has error parameter', async () => {
    // Set location.search to simulate error parameter
    Object.defineProperty(window, 'location', { 
      value: { search: '?error=unauthorized_domain', href: 'http://localhost:3000/login' },
      writable: true
    });
    
    render(<LoginForm />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/you must use a company email address to log in/i)).toBeInTheDocument();
    });
  });

  test('blocks login attempt with unauthorized email domain', async () => {
    // Mock implementation of isAllowedEmailDomain to return false
    (isAllowedEmailDomain as jest.Mock).mockReturnValue(false);
    
    render(<LoginForm />);
    
    // Fill in form with unauthorized email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/you must use a company email address to log in/i)).toBeInTheDocument();
    });
    
    // Verify Supabase signInWithPassword was NOT called
    const supabase = createClient();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  test('allows login attempt with authorized email domain', async () => {
    // Mock implementation of isAllowedEmailDomain to return true
    (isAllowedEmailDomain as jest.Mock).mockReturnValue(true);
    
    // Set up a different spy mechanism - mock the entire client
    const mockSignInWithPassword = jest.fn().mockResolvedValue({ error: null });
    
    // Override the mock implementation for this test
    jest.spyOn(require('@/lib/supabase/client'), 'createClient').mockImplementation(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: null } 
        }),
        signInWithPassword: mockSignInWithPassword,
        signInWithOAuth: jest.fn(),
        signUp: jest.fn(),
      }
    }));
    
    render(<LoginForm />);
    
    // Fill in form with authorized email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@internetbrands.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    
    // Wait for loading state to appear and disappear
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@internetbrands.com',
        password: 'password123',
      });
    });
  });
});