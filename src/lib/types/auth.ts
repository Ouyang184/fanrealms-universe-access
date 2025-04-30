import { User, Session } from '@supabase/supabase-js';

// Define the Profile type that was missing
export type Profile = {
  id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
  website?: string | null;
};

export type AuthResult =
  | { success: true; user: User; session: Session }
  | { success: false; error: { message: string } };

export interface AuthError {
  message: string;
  [key: string]: any;
}

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
};
