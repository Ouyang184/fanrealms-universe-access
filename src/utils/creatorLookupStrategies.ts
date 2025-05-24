
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
  
  const { data: creatorById, error: idError } = await supabase
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
    .eq('id', identifier)
    .maybeSingle();
    
  if (creatorById && creatorById.users) {
    console.log("Found creator by creator.id:", creatorById);
    
    // Create the display name once and use it for both properties
    const displayNameValue = creatorById.display_name || creatorById.users.username;
    
    const creatorProfile = {
      ...creatorById,
      id: creatorById.id,      // Primary key from creators table
      user_id: creatorById.user_id, // Keep user_id from auth
      username: creatorById.users.username || `user-${creatorById.user_id.substring(0, 8)}`,
      email: creatorById.users.email || "",
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue, // Add this required property
      avatar_url: creatorById.users.profile_picture || null,
      tags: creatorById.tags || []
    };
    
    return creatorProfile as CreatorProfile;
  }
  
  return null;
};

// Strategy 2: Find by username
export const findByUsername = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;
  
  console.log(`Looking up creator by username: "${cleanedIdentifier}"`);
  
  const { data: userByUsername, error: usernameError } = await supabase
    .from('users')
    .select('*')
    .eq('username', cleanedIdentifier)
    .maybeSingle();
  
  if (userByUsername) {
    console.log("Found user by username:", userByUsername);
    const userId = userByUsername.id;
    
    // Get creator info for this user
    const { data: creatorData, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (creatorData) {
      console.log("Found creator info for username:", creatorData);
      
      // Create the display name once and use it for both properties
      const displayNameValue = creatorData.display_name || userByUsername.username;
      
      // Build and return the combined profile
      const creatorProfile = {
        ...creatorData,
        ...userByUsername,
        id: creatorData.id, // Use creator table ID (needed for social links)
        user_id: userId,    // Store user_id separately
        fullName: displayNameValue,
        display_name: displayNameValue,
        displayName: displayNameValue, // Add this required property
        username: userByUsername.username,
        avatar_url: userByUsername.profile_picture || null,
        tags: creatorData.tags || []
      };
      
      return creatorProfile as CreatorProfile;
    }
  }
  
  return null;
};

// Strategy 3: Find by user_id
export const findByUserId = async (cleanedIdentifier?: string) => {
  if (!cleanedIdentifier) return null;
  
  console.log(`Looking up creator by user_id: "${cleanedIdentifier}"`);
  
  const { data: creatorByUserId, error: userIdError } = await supabase
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
    .eq('user_id', cleanedIdentifier)
    .maybeSingle();
    
  if (creatorByUserId && creatorByUserId.users) {
    console.log("Found creator by user_id:", creatorByUserId);
    
    // Create the display name once and use it for both properties
    const displayNameValue = creatorByUserId.display_name || creatorByUserId.users.username;
    
    const creatorProfile = {
      ...creatorByUserId,
      id: creatorByUserId.id,      // Primary key from creators table
      user_id: creatorByUserId.user_id, // Keep user_id from auth
      username: creatorByUserId.users.username || `user-${creatorByUserId.user_id.substring(0, 8)}`,
      email: creatorByUserId.users.email || "",
      fullName: displayNameValue,
      display_name: displayNameValue,
      displayName: displayNameValue, // Add this required property
      avatar_url: creatorByUserId.users.profile_picture || null,
      tags: creatorByUserId.tags || []
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
