import { fetchAPI } from './api';
import { signOut as nextAuthSignOut } from 'next-auth/react';

/**
 * Auth utility functions for authentication and user management
 * These functions are thin wrappers around NextAuth.js functionality
 */

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export async function registerUser(credentials: RegisterCredentials) {
  try {
    const response = await fetchAPI('/api/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign out the current user using NextAuth.js
 */
export async function signOut() {
  try {
    await nextAuthSignOut({ callbackUrl: '/login' });
  } catch (error) {
    console.error('Sign out error:', error);
  }
}