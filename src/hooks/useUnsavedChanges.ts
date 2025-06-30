
import { useState, useEffect } from 'react';

export function useUnsavedChanges<T>(initialData: T) {
  const [currentData, setCurrentData] = useState<T>(initialData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasUnsavedChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
    setHasChanges(hasUnsavedChanges);
  }, [currentData, initialData]);

  const updateData = (newData: Partial<T>) => {
    setCurrentData(prev => ({ ...prev, ...newData }));
  };

  const resetChanges = () => {
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
