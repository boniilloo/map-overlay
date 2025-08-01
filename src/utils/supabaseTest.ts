import { supabase } from '../services/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
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
    
    console.log('Supabase connection successful!');
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
  console.log('Environment Variables Check:');
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.REACT_APP_SUPABASE_ANON_KEY.length + ')' : 'Missing');
}; 