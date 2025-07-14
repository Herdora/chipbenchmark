import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our tables
export interface BenchmarkRequest {
  id?: number;
  created_at?: string;
  request: string;
}

export interface EmailSubscription {
  id?: number;
  created_at?: string;
  email: string;
}

// API functions
export async function submitBenchmarkRequest(request: string): Promise<{ success: boolean; error?: string; }> {
  try {
    const { error } = await supabase
      .from('requests')
      .insert([{ request }]);

    if (error) {
      console.error('Error submitting benchmark request:', error);
      return { success: false, error: error.message };
    }

    console.log('Benchmark request submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function submitEmailSubscription(email: string): Promise<{ success: boolean; error?: string; }> {
  try {
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('stay_updated')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing email:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existing) {
      return { success: false, error: 'Email is already subscribed' };
    }

    // Insert new subscription
    const { error } = await supabase
      .from('stay_updated')
      .insert([{ email }]);

    if (error) {
      console.error('Error submitting email subscription:', error);
      return { success: false, error: error.message };
    }

    console.log('Email subscription submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
} 