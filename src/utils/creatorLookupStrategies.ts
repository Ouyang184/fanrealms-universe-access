
import { supabase } from "@/lib/supabase";
import { CreatorProfile } from "@/types";

// Helper function to clean identifier
export const cleanIdentifier = (identifier?: string): string | undefined => {
  return identifier?.startsWith('user-') 
    ? identifier.substring(5) // Remove "user-" prefix
    : identifier;
};

// Strategy 1: Find by creator.id (primary key)
export const findByCreatorId = async (identifier?: string) => {
  if (!identifier) return null;
  
  console.log(`Looking up creator by creator.id: "${identifier}"`);
  
  // First try to get the creator via secure RPC
  const { data, error } = await supabase
    .rpc('get_public_creator_profile', { p_creator_id: identifier });
  
  const row: any = Array.isArray(data) ? data[0] : data;
  
  if (row) {
    console.log("Found creator by creator.id (RPC):", row);
    
    const displayNameValue = row.display_name || row.username || `Creator ${identifier.substring(0, 8)}`;
    
    const creatorProfile = {
      ...row,
      id: row.id,
      user_id: row.user_id,
      username: row.username || `user-${(row.user_id || '').substring(0, 8)}`,
      email: "",
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue,
      avatar_url: row.profile_image_url || null,
      tags: row.tags || []
    };
    
    return creatorProfile as CreatorProfile;
  }
  
  return null;
};

// Strategy 2: Find by username
export const findByUsername = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;
  
  console.log(`Looking up creator by username: "${cleanedIdentifier}"`);
  
  // Use RPC to get by username directly
  const { data, error } = await supabase
    .rpc('get_public_creator_profile', { p_username: cleanedIdentifier });
  const row: any = Array.isArray(data) ? data[0] : data;
  
  if (row) {
    console.log("Found creator by username (RPC):", row);
    const displayNameValue = row.display_name || row.username;
    const creatorProfile = {
      ...row,
      id: row.id,
      user_id: row.user_id,
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue,
      username: row.username,
      avatar_url: row.profile_image_url || null,
      tags: row.tags || []
    };
    return creatorProfile as CreatorProfile;
  }
  
  return null;
};

// Strategy 3: Find by user_id
export const findByUserId = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;
  
  console.log(`Looking up creator by user_id: "${cleanedIdentifier}"`);
  
  const { data, error } = await supabase
    .rpc('get_public_creator_profile', { p_user_id: cleanedIdentifier });
  const row: any = Array.isArray(data) ? data[0] : data;
  
  if (row) {
    console.log("Found creator by user_id (RPC):", row);
    const displayNameValue = row.display_name || row.username;
    const creatorProfile = {
      ...row,
      id: row.id,
      user_id: row.user_id,
      username: row.username || `user-${(row.user_id || '').substring(0, 8)}`,
      email: "",
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue,
      avatar_url: row.profile_image_url || null,
      tags: row.tags || []
    };
    return creatorProfile as CreatorProfile;
  }
  
  return null;
};

// Strategy 4: Find by display_name
export const findByDisplayName = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;
  
  console.log(`Looking up creator by display_name: "${cleanedIdentifier}"`);
  
  // Use the secure function to get only public creator data
  const { data: allCreators, error: displayNameError } = await supabase
    .rpc('get_public_creators_list', { 
      p_search: cleanedIdentifier, 
      p_sort: 'created_at', 
      p_limit: 50, 
      p_offset: 0 
    });
    
  if (allCreators && allCreators.length > 0) {
    // Find exact match for display_name
    const creatorByDisplayName = allCreators.find(c => 
      c.display_name?.toLowerCase() === cleanedIdentifier.toLowerCase()
    );
    
    if (creatorByDisplayName) {
      console.log("Found creator by display_name:", creatorByDisplayName);
      const c = creatorByDisplayName as any;
      const displayNameValue = c.display_name || c.username;
      
      const creatorProfile = {
        ...c,
        id: c.id,
        user_id: c.user_id,
        username: c.username || (c.user_id ? `user-${c.user_id.substring(0, 8)}` : ''),
        email: "",
        fullName: displayNameValue,
        display_name: displayNameValue,
        displayName: displayNameValue,
        avatar_url: c.profile_image_url || null,
        tags: c.tags || []
      };
      
      return creatorProfile as CreatorProfile;
    }
  }
  
  return null;
};

// Strategy 5: Find by shortened user_id (with "user-" prefix)
export const findByAbbreviatedUserId = async (originalIdentifier?: string) => {
  if (!originalIdentifier || !originalIdentifier.startsWith('user-')) return null;
  
  console.log(`Looking up creator by abbreviated user_id: "${originalIdentifier}"`);
  
  // Get all creators using secure function and check if any match the formatted ID pattern
  const { data: allCreators, error: allCreatorsError } = await supabase
    .rpc('get_public_creators_list', { 
      p_search: null, 
      p_sort: 'created_at', 
      p_limit: 100, 
      p_offset: 0 
    });
    
  if (allCreators && allCreators.length > 0) {
    // Find by comparing the abbreviated user ID format
    const matchingCreator = (allCreators as any[]).find((c: any) => {
      const shortId = c.user_id ? `user-${c.user_id.substring(0, 8)}` : null;
      return shortId === originalIdentifier;
    });
    
    if (matchingCreator) {
      console.log("Found creator by abbreviated ID:", matchingCreator);
      const m = matchingCreator as any;
      const displayNameValue = m.display_name || m.username;
      
      const creatorProfile = {
        ...m,
        id: m.id,
        user_id: m.user_id,
        username: m.username || (m.user_id ? `user-${m.user_id.substring(0, 8)}` : ''),
        email: "",
        fullName: displayNameValue,
        display_name: displayNameValue,
        displayName: displayNameValue,
        avatar_url: m.profile_image_url || null,
        tags: m.tags || []
      };
      
      return creatorProfile as CreatorProfile;
    }
  }
  
  return null;
};
