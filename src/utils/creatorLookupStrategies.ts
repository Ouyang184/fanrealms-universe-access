
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
  
  const { data: creatorsWithDisplayName, error: displayNameError } = await supabase
    .from('creators')
    .select(`
      *,
      users!creators_user_id_fkey (
        id,
        username,
        email,
        profile_picture
      )
    `)
    .ilike('display_name', cleanedIdentifier)
    .limit(1);
    
  if (creatorsWithDisplayName && creatorsWithDisplayName.length > 0) {
    const creatorByDisplayName = creatorsWithDisplayName[0];
    console.log("Found creator by display_name:", creatorByDisplayName);
    
    // Create the display name once and use it for both properties
    const displayNameValue = creatorByDisplayName.display_name || creatorByDisplayName.users?.username;
    
    const creatorProfile = {
      ...creatorByDisplayName,
      id: creatorByDisplayName.id,         // Primary key from creators table
      user_id: creatorByDisplayName.user_id,   // Keep user_id from auth
      username: creatorByDisplayName.users?.username || `user-${creatorByDisplayName.user_id.substring(0, 8)}`,
      email: creatorByDisplayName.users?.email || "",
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue, // Add this required property
      avatar_url: creatorByDisplayName.users?.profile_picture || null,
      tags: creatorByDisplayName.tags || []
    };
    
    return creatorProfile as CreatorProfile;
  }
  
  return null;
};

// Strategy 5: Find by shortened user_id (with "user-" prefix)
export const findByAbbreviatedUserId = async (originalIdentifier?: string) => {
  if (!originalIdentifier || !originalIdentifier.startsWith('user-')) return null;
  
  console.log(`Looking up creator by abbreviated user_id: "${originalIdentifier}"`);
  
  // Get all creators and check if any match the formatted ID pattern
  const { data: allCreators, error: allCreatorsError } = await supabase
    .from('creators')
    .select(`
      *,
      users!creators_user_id_fkey (
        id,
        username,
        email,
        profile_picture
      )
    `)
    .limit(100);
    
  if (allCreators && allCreators.length > 0) {
    // Find by comparing the abbreviated user ID format
    const matchingCreator = allCreators.find(c => {
      const shortId = c.user_id ? `user-${c.user_id.substring(0, 8)}` : null;
      return shortId === originalIdentifier;
    });
    
    if (matchingCreator) {
      console.log("Found creator by abbreviated ID:", matchingCreator);
      
      // Create the display name once and use it for both properties
      const displayNameValue = matchingCreator.display_name || matchingCreator.users?.username;
      
      const creatorProfile = {
        ...matchingCreator,
        id: matchingCreator.id,          // Primary key from creators table
        user_id: matchingCreator.user_id,    // Keep user_id from auth
        username: matchingCreator.users?.username || `user-${matchingCreator.user_id.substring(0, 8)}`,
        email: matchingCreator.users?.email || "",
        fullName: displayNameValue,
        display_name: displayNameValue,
        displayName: displayNameValue, // Add this required property
        avatar_url: matchingCreator.users?.profile_picture || null,
        tags: matchingCreator.tags || []
      };
      
      return creatorProfile as CreatorProfile;
    }
  }
  
  return null;
};
