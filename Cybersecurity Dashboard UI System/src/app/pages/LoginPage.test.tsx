import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { BrowserRouter } from 'react-router';
import { AuthService } from '../../services/auth';

// Mock the auth service
vi.mock('../../services/auth', () => ({
  AuthService: {
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
  },
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    // Check if key elements exist
    expect(screen.getAllByText('Secure Login').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('analyst@vigicore.security')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    
    // Check if autocomplete attributes are set correctly for security
    const emailInput = screen.getByPlaceholderText('analyst@vigicore.security');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    expect(emailInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  it('shows error when login fails', async () => {
    // Setup mock to fail
    vi.mocked(AuthService.login).mockResolvedValueOnce({ 
      success: false, 
      error: 'Invalid credentials' 
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('analyst@vigicore.security');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /secure login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Wait for the error message to appear
    const errorMessage = await screen.findByText('Invalid credentials');
    expect(errorMessage).toBeInTheDocument();
  });
});
