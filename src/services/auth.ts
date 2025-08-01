import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// Authentication service
export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url
    };
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url
    };
  },

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, name?: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name: name
        }
      }
    });

    if (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url
    };
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url
        };
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
}; 