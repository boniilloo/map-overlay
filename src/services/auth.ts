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
    
    // Asegurar que el usuario existe en la tabla users
    await this.ensureUserExists(user);
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url
    };
  },

  // Ensure user exists in users table
  async ensureUserExists(user: User): Promise<void> {
    try {
      // Extraer nombre de diferentes fuentes posibles (Google, etc.)
      const name = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.display_name ||
                   user.email?.split('@')[0]; // Fallback al email sin dominio
      
      const userData = {
        id: user.id,
        email: user.email || '',
        name: name,
        updated_at: new Date().toISOString()
      };
      
      // Crear una promesa con timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('ensureUserExists timeout')), 5000);
      });
      
      const upsertPromise = supabase
        .from('users')
        .upsert([userData], {
          onConflict: 'id'
        })
        .select();
      
      const { error } = await Promise.race([upsertPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error ensuring user exists:', error);
      }
    } catch (error: any) {
      console.error('Exception ensuring user exists:', error);
    }
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
    // Obtener la IP de la máquina para redirección móvil
    const getRedirectUrl = () => {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Si estamos en localhost, usar la IP de la máquina
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Usar la IP real de la máquina
        return `http://192.168.75.191:${port}`;
      }
      
      // Si ya estamos en una IP, usar la misma
      return window.location.origin;
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl()
      }
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  // Handle OAuth callback and ensure user exists
  async handleOAuthCallback(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Asegurar que el usuario existe en la tabla users
    await this.ensureUserExists(user);
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url
    };
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
        // Asegurar que el usuario existe en la tabla users
        await this.ensureUserExists(session.user);
        
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.user_metadata?.display_name ||
                session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url
        };
        callback(user);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // También manejar refresh de token para OAuth
        await this.ensureUserExists(session.user);
        
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.user_metadata?.display_name ||
                session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url
        };
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
}; 