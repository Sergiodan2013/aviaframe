// Supabase client initialization
const { createClient } = require('@supabase/supabase-js');

// Load Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Backend doesn't need to persist sessions
    detectSessionInUrl: false
  }
});

// Export the client for use in other modules
module.exports = supabase;
