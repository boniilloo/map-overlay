import { supabase } from '../services/supabase';

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    return {
      success: true,
      data: data
    };
  } catch (err) {
    console.error('Unexpected error testing Supabase:', err);
    return {
      success: false,
      error: 'Unexpected error',
      details: err
    };
  }
};

export const logEnvironmentVariables = () => {
  // Environment variables check function (console.log removed)
}; 