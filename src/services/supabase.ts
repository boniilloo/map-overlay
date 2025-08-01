import { createClient } from '@supabase/supabase-js';
import { OverlayData, UserData } from '../types';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Please check your .env.local file.');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Overlay operations
export const overlayService = {
  // Get all overlays for a user
  async getUserOverlays(userId: string): Promise<OverlayData[]> {
    const { data, error } = await supabase
      .from('overlays')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching overlays:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new overlay
  async createOverlay(overlay: Omit<OverlayData, 'id' | 'createdAt' | 'updatedAt'>): Promise<OverlayData> {
    const { data, error } = await supabase
      .from('overlays')
      .insert([{
        name: overlay.name,
        image_url: overlay.imageUrl,
        opacity: overlay.opacity,
        scale: overlay.scale,
        rotation: overlay.rotation,
        position: overlay.position,
        anchor_points: overlay.anchorPoints,
        user_id: overlay.userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating overlay:', error);
      throw error;
    }

    return data;
  },

  // Update an existing overlay
  async updateOverlay(id: string, updates: Partial<OverlayData>): Promise<OverlayData> {
    const { data, error } = await supabase
      .from('overlays')
      .update({
        name: updates.name,
        opacity: updates.opacity,
        scale: updates.scale,
        rotation: updates.rotation,
        position: updates.position,
        anchor_points: updates.anchorPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating overlay:', error);
      throw error;
    }

    return data;
  },

  // Delete an overlay
  async deleteOverlay(id: string): Promise<void> {
    const { error } = await supabase
      .from('overlays')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting overlay:', error);
      throw error;
    }
  }
};

// User operations
export const userService = {
  // Get user data
  async getUser(userId: string): Promise<UserData | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    return data;
  },

  // Create or update user
  async upsertUser(user: Partial<UserData>): Promise<UserData> {
    const { data, error } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      throw error;
    }

    return data;
  },

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: UserData['preferences']): Promise<UserData> {
    const { data, error } = await supabase
      .from('users')
      .update({
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }

    return data;
  }
};

// File upload operations
export const fileService = {
  // Upload image to Supabase Storage
  async uploadImage(file: File, userId: string): Promise<string> {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('overlay-images')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('overlay-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  // Delete image from storage
  async deleteImage(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('overlay-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}; 