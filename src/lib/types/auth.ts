
export type DbUser = {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  profile_picture?: string
  bio?: string
  website?: string
  created_at?: string
  updated_at?: string
}

import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  profile_picture?: string;
  display_name?: string | null;
  creator_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isProfileComplete: boolean;
  /** True from the moment signOut() is invoked until it resolves. */
  signingOut: boolean;
  refreshProfile: () => Promise<Profile | null>;
  /**
   * Re-fetches the profile and returns the route the user should be on
   * given completion state. Use this after login or any profile mutation
   * to avoid relying on async React state updates before navigating.
   */
  resolvePostAuthRoute: (returnTo?: string) => Promise<string>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken?: string, fullName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<Profile | null>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: { message: string };
  mfaRequired?: boolean;
  userId?: string;
  factors?: any[];
  emailMfaRequired?: boolean;
  email?: string;
  needsEmailConfirmation?: boolean;
}
