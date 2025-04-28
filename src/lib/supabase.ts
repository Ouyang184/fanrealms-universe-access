
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Re-export the supabase client
export { supabase };

// Export types for ease of use
export type Profile = Database['public']['Tables']['users']['Row'];
export type Session = Record<string, any>; // Update this to match your actual session type
