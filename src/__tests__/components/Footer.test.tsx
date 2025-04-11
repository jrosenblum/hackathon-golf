import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';

describe('Footer Component', () => {
  test('renders company copyright notice', () => {
    render(<Footer />);
    
    // Check for copyright text
    const copyrightElement = screen.getByText(/© 2025 MH Sub I, LLC dba Internet Brands/i);
    expect(copyrightElement).toBeInTheDocument();
  });
  
  test('renders Terms of Service link', () => {
    render(<Footer />);
    
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
  });
  
  test('renders Privacy Policy link', () => {
    render(<Footer />);
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});