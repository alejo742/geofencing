'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trigger, TriggersExport } from '@/types';

const TRIGGERS_STORAGE_KEY = 'geofencing-triggers';

export function useTriggers() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
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
  const saveTriggers = useCallback((triggersToSave: Trigger[]) => {
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

  // Create a new membership trigger
  const createMembershipTrigger = useCallback((
    structureCode: string,
    triggerType: 'enter' | 'exit',
    title: string,
    body: string,
    flowId: string
  ): Trigger => {
    const now = new Date().toISOString();
    const newTrigger: Trigger = {
      id: generateTriggerId(),
      type: 'membership',
      structureCode,
      triggerType,
      notificationConfig: {
        title: title.trim(),
        body: body.trim()
      },
      severity: 'medium',
      flowId: flowId.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const updatedTriggers = [...triggers, newTrigger];
    saveTriggers(updatedTriggers);
    return newTrigger;
  }, [triggers, generateTriggerId, saveTriggers]);

  // Create a new permanence trigger
  const createPermanenceTrigger = useCallback((
    structureCode: string,
    permanenceHours: number,
    title: string,
    body: string,
    flowId: string
  ): Trigger => {
    const now = new Date().toISOString();
    const newTrigger: Trigger = {
      id: generateTriggerId(),
      type: 'permanence',
      structureCode,
      permanenceHours,
      notificationConfig: {
        title: title.trim(),
        body: body.trim()
      },
      severity: 'medium',
      flowId: flowId.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const updatedTriggers = [...triggers, newTrigger];
    saveTriggers(updatedTriggers);
    return newTrigger;
  }, [triggers, generateTriggerId, saveTriggers]);

  // Legacy create function for backward compatibility
  const createTrigger = createMembershipTrigger;

  // Update an existing trigger
  const updateTrigger = useCallback((
    triggerId: string,
    updates: Partial<Pick<Trigger, 'notificationConfig' | 'flowId' | 'isActive'>>
  ) => {
    const updatedTriggers = triggers.map(trigger => {
      if (trigger.id === triggerId) {
        return {
          ...trigger,
          ...updates,
          updatedAt: new Date().toISOString()
        } as Trigger;
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
    return triggers.filter(trigger => 
      (trigger.type === 'membership' || trigger.type === 'permanence') && 
      trigger.structureCode === structureCode
    );
  }, [triggers]);

  // Toggle trigger active state
  const toggleTriggerActive = useCallback((triggerId: string) => {
    updateTrigger(triggerId, { 
      isActive: !triggers.find(t => t.id === triggerId)?.isActive 
    });
  }, [triggers, updateTrigger]);

  // Check if structure has triggers
  const hasTriggersForStructure = useCallback((structureCode: string) => {
    return triggers.some(trigger => 
      (trigger.type === 'membership' || trigger.type === 'permanence') && 
      trigger.structureCode === structureCode
    );
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
    const membershipTriggers = triggers.filter(t => t.type === 'membership');
    const enterTriggers = membershipTriggers.filter(t => t.triggerType === 'enter').length;
    const exitTriggers = membershipTriggers.filter(t => t.triggerType === 'exit').length;
    const permanenceTriggers = triggers.filter(t => t.type === 'permanence').length;
    const structuresWithTriggers = new Set(
      triggers
        .filter(t => t.type === 'membership' || t.type === 'permanence')
        .map(t => t.structureCode)
    ).size;

    return {
      totalTriggers,
      activeTriggers,
      inactiveTriggers: totalTriggers - activeTriggers,
      membershipTriggers: membershipTriggers.length,
      enterTriggers,
      exitTriggers,
      permanenceTriggers,
      structuresWithTriggers
    };
  }, [triggers]);

  return {
    // State
    triggers,
    isLoading,
    
    // CRUD operations
    createTrigger,
    createMembershipTrigger,
    createPermanenceTrigger,
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
