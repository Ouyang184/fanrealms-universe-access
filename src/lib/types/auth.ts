
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
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<Profile | null>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: { message: string };
}
