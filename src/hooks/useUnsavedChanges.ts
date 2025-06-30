
import { useState, useEffect } from 'react';

export function useUnsavedChanges<T>(initialData: T) {
  const [currentData, setCurrentData] = useState<T>(initialData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setCurrentData(initialData);
    setHasChanges(false);
  }, [initialData]);

  useEffect(() => {
    // Better comparison that handles nested objects and arrays
    const hasUnsavedChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
    console.log('Change detection:', {
      current: currentData,
      initial: initialData,
      hasChanges: hasUnsavedChanges
    });
    setHasChanges(hasUnsavedChanges);
  }, [currentData, initialData]);

  const updateData = (newData: Partial<T>) => {
    console.log('Updating data with:', newData);
    setCurrentData(prev => {
      const updated = { ...prev, ...newData };
      console.log('Updated data:', updated);
      return updated;
    });
  };

  const resetChanges = () => {
    console.log('Resetting changes to initial data:', initialData);
    setCurrentData(initialData);
    setHasChanges(false);
  };

  return {
    currentData,
    hasChanges,
    updateData,
    resetChanges
  };
}
