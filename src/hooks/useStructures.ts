'use client';

import { useState, useEffect, useCallback } from 'react';
import { Structure } from '@/types';
import { saveStructures, loadStructures } from '@/lib/storage';

/**
 * Specialized hook for working with geofence structures
 * @returns Object with structures data and methods
 */
export function useStructures() {
  // Use regular useState instead of useLocalStorage to break dependency cycle
  const [structures, setStructures] = useState<Structure[]>(() => {
    try {
      return loadStructures();
    } catch (error) {
      console.error('Failed to load structures:', error);
      return [];
    }
  });
  
  const [activeStructureId, setActiveStructureId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('evergreen_active_structure');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  });
  
  // Save structures to localStorage whenever they change
  useEffect(() => {
    try {
      saveStructures(structures);
    } catch (error) {
      console.error('Failed to save structures:', error);
    }
  }, [structures]);
  
  // Save active structure ID whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('evergreen_active_structure', JSON.stringify(activeStructureId));
    } catch (error) {
      console.error('Failed to save active structure ID:', error);
    }
  }, [activeStructureId]);
  
  // Find the active structure
  const activeStructure = structures.find(s => s.id === activeStructureId) || null;
  
  /**
   * Add a new structure
   * @param name Name of the new structure
   * @returns The newly created structure
   */
  const addStructure = useCallback((name: string) => {
    const newStructure: Structure = {
      id: crypto.randomUUID(),
      name,
      mapPoints: [],
      walkPoints: [],
      triggerBand: {
        points: [],
        thickness: 5 // Default thickness
      },
      lastModified: new Date().toISOString()
    };
    
    setStructures(prev => [...prev, newStructure]);
    setActiveStructureId(newStructure.id);
    return newStructure;
  }, []);
  
  /**
   * Update an existing structure
   * @param updatedStructure The structure with updated properties
   */
  const updateStructure = useCallback((updatedStructure: Structure) => {
    const updated = {
      ...updatedStructure,
      lastModified: new Date().toISOString()
    };
    
    setStructures(prev => 
      prev.map(s => s.id === updated.id ? updated : s)
    );
  }, []);
  
  return {
    structures,
    activeStructureId,
    activeStructure,
    setActiveStructureId,
    addStructure,
    updateStructure
  };
}