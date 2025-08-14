import { useState, useEffect, useCallback } from 'react';

interface FormData {
  commission_type_id: string;
  title: string;
  description: string;
  budget_range_min: string;
  budget_range_max: string;
  deadline: string;
  customer_notes: string;
  selected_addons: Array<{ name: string; price: number; quantity: number }>;
  character_count: number;
}

interface DraftData extends FormData {
  creatorId: string;
  lastSaved: string;
}

export const useDraftStorage = (creatorId: string, commissionTypeId: string, userId?: string) => {
  const getDraftKey = () => `commission_draft_${userId}_${creatorId}_${commissionTypeId}`;
  
  const [draftExists, setDraftExists] = useState(false);
  
  // Check if draft exists on mount
  useEffect(() => {
    if (!userId || !creatorId || !commissionTypeId) return;
    
    const savedDraft = localStorage.getItem(getDraftKey());
    setDraftExists(!!savedDraft);
  }, [userId, creatorId, commissionTypeId]);

  const saveDraft = useCallback((formData: FormData) => {
    if (!userId || !creatorId || !commissionTypeId) return;
    
    const draftData: DraftData = {
      ...formData,
      creatorId,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    setDraftExists(true);
  }, [userId, creatorId, commissionTypeId]);

  const loadDraft = useCallback((): FormData | null => {
    if (!userId || !creatorId || !commissionTypeId) return null;
    
    try {
      const savedDraft = localStorage.getItem(getDraftKey());
      if (!savedDraft) return null;
      
      const draftData: DraftData = JSON.parse(savedDraft);
      
      // Return just the form data, excluding our metadata
      const { creatorId: _, lastSaved: __, ...formData } = draftData;
      return formData;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [userId, creatorId, commissionTypeId]);

  const clearDraft = useCallback(() => {
    if (!userId || !creatorId || !commissionTypeId) return;
    
    localStorage.removeItem(getDraftKey());
    setDraftExists(false);
  }, [userId, creatorId, commissionTypeId]);

  const getDraftInfo = useCallback((): { exists: boolean; lastSaved?: Date } => {
    if (!userId || !creatorId || !commissionTypeId) return { exists: false };
    
    try {
      const savedDraft = localStorage.getItem(getDraftKey());
      if (!savedDraft) return { exists: false };
      
      const draftData: DraftData = JSON.parse(savedDraft);
      return {
        exists: true,
        lastSaved: new Date(draftData.lastSaved)
      };
    } catch (error) {
      return { exists: false };
    }
  }, [userId, creatorId, commissionTypeId]);

  return {
    draftExists,
    saveDraft,
    loadDraft,
    clearDraft,
    getDraftInfo
  };
};