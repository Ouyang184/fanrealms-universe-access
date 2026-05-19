
import { supabase } from "@/lib/supabase";
import { CreatorProfile } from "@/types";

// Helper function to clean identifier
export const cleanIdentifier = (identifier?: string): string | undefined => {
  return identifier?.startsWith('user-')
    ? identifier.substring(5) // Remove "user-" prefix
    : identifier;
};

// Centralized mapper: DB row -> CreatorProfile
const mapRowToCreatorProfile = (row: any, fallbackId?: string): CreatorProfile => {
  const userId: string | undefined = row.user_id;
  const username =
    row.username || (userId ? `user-${userId.substring(0, 8)}` : '');
  const displayNameValue =
    row.display_name ||
    row.username ||
    (fallbackId ? `Creator ${fallbackId.substring(0, 8)}` : username);

  return {
    ...row,
    id: row.id,
    user_id: userId,
    username,
    email: row.email ?? "",
    fullName: displayNameValue,
    display_name: displayNameValue,
    displayName: displayNameValue,
    avatar_url: row.profile_image_url || null,
    tags: row.tags || [],
  } as CreatorProfile;
};

const firstRow = (data: unknown): any | null => {
  if (!data) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
};

// Strategy 1: Find by creator.id (primary key)
export const findByCreatorId = async (identifier?: string) => {
  if (!identifier) return null;

  const { data } = await supabase
    .rpc('get_public_creator_profile', { p_creator_id: identifier });
  const row = firstRow(data);
  if (!row) return null;

  return mapRowToCreatorProfile(row, identifier);
};

// Strategy 2: Find by username
export const findByUsername = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;

  const { data } = await supabase
    .rpc('get_public_creator_profile', { p_username: cleanedIdentifier });
  const row = firstRow(data);
  if (!row) return null;

  return mapRowToCreatorProfile(row);
};

// Strategy 3: Find by user_id
export const findByUserId = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;

  const { data } = await supabase
    .rpc('get_public_creator_profile', { p_user_id: cleanedIdentifier });
  const row = firstRow(data);
  if (!row) return null;

  return mapRowToCreatorProfile(row);
};

// Strategy 4: Find by display_name
export const findByDisplayName = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;

  const { data: allCreators } = await supabase
    .rpc('get_public_creators_list', {
      p_search: cleanedIdentifier,
      p_sort: 'created_at',
      p_limit: 50,
      p_offset: 0,
    });

  if (!allCreators?.length) return null;

  const match = (allCreators as any[]).find(
    (c) => c.display_name?.toLowerCase() === cleanedIdentifier.toLowerCase()
  );
  if (!match) return null;

  return mapRowToCreatorProfile(match);
};

// Strategy 5: Find by shortened user_id (with "user-" prefix)
export const findByAbbreviatedUserId = async (originalIdentifier?: string) => {
  if (!originalIdentifier?.startsWith('user-')) return null;

  const { data: allCreators } = await supabase
    .rpc('get_public_creators_list', {
      p_search: null,
      p_sort: 'created_at',
      p_limit: 100,
      p_offset: 0,
    });

  if (!allCreators?.length) return null;

  const match = (allCreators as any[]).find((c) => {
    const shortId = c.user_id ? `user-${c.user_id.substring(0, 8)}` : null;
    return shortId === originalIdentifier;
  });
  if (!match) return null;

  return mapRowToCreatorProfile(match);
};
