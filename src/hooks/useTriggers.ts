'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeofencingTrigger, TriggersExport } from '@/types';

const TRIGGERS_STORAGE_KEY = 'geofencing-triggers';

export function useTriggers() {
  const [triggers, setTriggers] = useState<GeofencingTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load triggers from localStorage on mount
  useEffect(() => {
    const savedTriggers = localStorage.getItem(TRIGGERS_STORAGE_KEY);
    if (savedTriggers) {
      try {
        const parsed = JSON.parse(savedTriggers);
        setTriggers(parsed);
      } catch (error) {
        console.error('Failed to parse saved triggers:', error);
        setTriggers([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save triggers to localStorage whenever triggers change
  const saveTriggers = useCallback((triggersToSave: GeofencingTrigger[]) => {
    try {
      localStorage.setItem(TRIGGERS_STORAGE_KEY, JSON.stringify(triggersToSave));
      setTriggers(triggersToSave);
    } catch (error) {
      console.error('Failed to save triggers:', error);
    }
  }, []);

  // Generate unique ID for new triggers
  const generateTriggerId = useCallback(() => {
    return `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new trigger
  const createTrigger = useCallback((
    structureCode: string,
    triggerType: 'enter' | 'exit',
    title: string,
    body: string,
    flowId: string
  ): GeofencingTrigger => {
    const now = new Date().toISOString();
    const newTrigger: GeofencingTrigger = {
      id: generateTriggerId(),
      structureCode,
      triggerType,
      notificationConfig: {
        title: title.trim(),
        body: body.trim()
      },
      flowId: flowId.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const updatedTriggers = [...triggers, newTrigger];
    saveTriggers(updatedTriggers);
    return newTrigger;
  }, [triggers, generateTriggerId, saveTriggers]);

  // Update an existing trigger
  const updateTrigger = useCallback((
    triggerId: string,
    updates: Partial<Pick<GeofencingTrigger, 'notificationConfig' | 'flowId' | 'isActive' | 'triggerType'>>
  ) => {
    const updatedTriggers = triggers.map(trigger => {
      if (trigger.id === triggerId) {
        return {
          ...trigger,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return trigger;
    });
    saveTriggers(updatedTriggers);
  }, [triggers, saveTriggers]);

  // Delete a trigger
  const deleteTrigger = useCallback((triggerId: string) => {
    const updatedTriggers = triggers.filter(trigger => trigger.id !== triggerId);
    saveTriggers(updatedTriggers);
  }, [triggers, saveTriggers]);

  // Get triggers for a specific structure
  const getTriggersForStructure = useCallback((structureCode: string) => {
    return triggers.filter(trigger => trigger.structureCode === structureCode);
  }, [triggers]);

  // Toggle trigger active state
  const toggleTriggerActive = useCallback((triggerId: string) => {
    updateTrigger(triggerId, { 
      isActive: !triggers.find(t => t.id === triggerId)?.isActive 
    });
  }, [triggers, updateTrigger]);

  // Check if structure has triggers
  const hasTriggersForStructure = useCallback((structureCode: string) => {
    return triggers.some(trigger => trigger.structureCode === structureCode);
  }, [triggers]);

  // Export triggers to JSON
  const exportTriggers = useCallback((): TriggersExport => {
    return {
      version: '1.0',
      triggers,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalTriggers: triggers.length
      }
    };
  }, [triggers]);

  // Import triggers from JSON
  const importTriggers = useCallback((exportData: TriggersExport, replaceAll: boolean = false) => {
    try {
      const incomingTriggers = exportData.triggers || [];
      
      if (replaceAll) {
        // Replace all existing triggers
        saveTriggers(incomingTriggers);
      } else {
        // Merge with existing triggers, avoiding duplicates
        const existingIds = new Set(triggers.map(t => t.id));
        const newTriggers = incomingTriggers.filter(t => !existingIds.has(t.id));
        const mergedTriggers = [...triggers, ...newTriggers];
        saveTriggers(mergedTriggers);
      }
      return true;
    } catch (error) {
      console.error('Failed to import triggers:', error);
      return false;
    }
  }, [triggers, saveTriggers]);

  // Clear all triggers
  const clearAllTriggers = useCallback(() => {
    saveTriggers([]);
  }, [saveTriggers]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const totalTriggers = triggers.length;
    const activeTriggers = triggers.filter(t => t.isActive).length;
    const enterTriggers = triggers.filter(t => t.triggerType === 'enter').length;
    const exitTriggers = triggers.filter(t => t.triggerType === 'exit').length;
    const structuresWithTriggers = new Set(triggers.map(t => t.structureCode)).size;

    return {
      totalTriggers,
      activeTriggers,
      inactiveTriggers: totalTriggers - activeTriggers,
      enterTriggers,
      exitTriggers,
      structuresWithTriggers
    };
  }, [triggers]);

  return {
    // State
    triggers,
    isLoading,
    
    // CRUD operations
    createTrigger,
    updateTrigger,
    deleteTrigger,
    
    // Query functions
    getTriggersForStructure,
    hasTriggersForStructure,
    
    // Utility functions
    toggleTriggerActive,
    
    // Import/Export
    exportTriggers,
    importTriggers,
    clearAllTriggers,
    
    // Statistics
    getStatistics
  };
}
