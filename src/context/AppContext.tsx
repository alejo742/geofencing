'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Structure, Point, MapMode, MapViewState } from '@/types';
import { saveStructures, loadStructures } from '@/lib/storage';
import { addMapPoint, movePoint, deletePoint } from '@/utils/mapUtils';

// Default map state
const DEFAULT_MAP_STATE: MapViewState = {
  center: { lat: 43.7044, lng: -72.2887 }, // Default to Dartmouth College
  zoom: 16
};

// Define the context type
type AppContextType = {
  // Structure-related state
  structures: Structure[];
  activeStructureId: string | null;
  activeStructure: Structure | null;
  setActiveStructureId: (id: string | null) => void;
  addStructure: (name: string) => Structure;
  updateStructure: (structure: Structure) => void;
  refreshStructures: () => Structure[];
  deleteStructure: (id: string) => void;
  
  // Map-related state
  mapState: MapViewState;
  setMapState: (state: MapViewState) => void;
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;
  
  // Point manipulation functions
  addPointToStructure: (point: Point, type: 'map' | 'walk') => void;
  movePointInStructure: (index: number, newPos: Point, type: 'map' | 'walk') => void;
  deletePointFromStructure: (index: number, type: 'map' | 'walk') => void;
  
  // Trigger band functions
  updateTriggerBandThickness: (thickness: number) => void;
  addPointToTriggerBand: (point: Point) => void;
};

// Create the context with default values
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  // Structure-related state
  const [structures, setStructures] = useState<Structure[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        return loadStructures();
      }
      return [];
    } catch (error) {
      console.error('Failed to load structures:', error);
      return [];
    }
  });
  
  const [activeStructureId, setActiveStructureId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('evergreen_active_structure');
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  });
  
  // Map-related state
  const [mapState, setMapState] = useState<MapViewState>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('evergreen_map_state');
        return stored ? JSON.parse(stored) : DEFAULT_MAP_STATE;
      }
      return DEFAULT_MAP_STATE;
    } catch (error) {
      return DEFAULT_MAP_STATE;
    }
  });
  
  const [mapMode, setMapMode] = useState<MapMode>('view');
  
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('evergreen_active_structure', JSON.stringify(activeStructureId));
      }
    } catch (error) {
      console.error('Failed to save active structure ID:', error);
    }
  }, [activeStructureId]);
  
  // Save map state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('evergreen_map_state', JSON.stringify(mapState));
      }
    } catch (error) {
      console.error('Failed to save map state:', error);
    }
  }, [mapState]);
  
  // Find the active structure
  const activeStructure = structures.find(s => s.id === activeStructureId) || null;
  
  // Simple functions without unnecessary memoization
  function refreshStructures() {
    try {
      const refreshedStructures = loadStructures();
      setStructures(refreshedStructures);
      
      if (typeof window !== 'undefined') {
        const storedActiveId = localStorage.getItem('evergreen_active_structure');
        if (storedActiveId) {
          setActiveStructureId(JSON.parse(storedActiveId));
        }
      }
      
      return refreshedStructures;
    } catch (error) {
      console.error('Failed to refresh structures:', error);
      return [];
    }
  }
  
  function addStructure(name: string) {
    const newStructure: Structure = {
      id: crypto.randomUUID(),
      name,
      mapPoints: [],
      walkPoints: [],
      triggerBand: {
        points: [],
        thickness: 5
      },
      lastModified: new Date().toISOString()
    };
    
    setStructures(prev => [...prev, newStructure]);
    setActiveStructureId(newStructure.id);
    return newStructure;
  }
  
  function updateStructure(updatedStructure: Structure) {
    const updated = {
      ...updatedStructure,
      lastModified: new Date().toISOString()
    };
    
    setStructures(prev => 
      prev.map(s => s.id === updated.id ? updated : s)
    );
  }
  
  function deleteStructure(id: string) {
    setStructures(prev => prev.filter(s => s.id !== id));
    
    // If we're deleting the active structure, clear the active ID
    if (activeStructureId === id) {
      setActiveStructureId(null);
    }
  }
  
  // Point manipulation functions - simplified
  function addPointToStructure(point: Point, type: 'map' | 'walk') {
    if (!activeStructure) return;
    
    let updatedStructure;
    if (type === 'map') {
      updatedStructure = addMapPoint(activeStructure, point);
    } else {
      updatedStructure = {
        ...activeStructure,
        walkPoints: [...activeStructure.walkPoints, point],
        lastModified: new Date().toISOString()
      };
    }
    
    updateStructure(updatedStructure);
  }
  
  function movePointInStructure(index: number, newPos: Point, type: 'map' | 'walk') {
    if (!activeStructure) return;
    
    const updatedStructure = movePoint(activeStructure, index, newPos, type);
    updateStructure(updatedStructure);
  }
  
  function deletePointFromStructure(index: number, type: 'map' | 'walk') {
    if (!activeStructure) return;
    
    const updatedStructure = deletePoint(activeStructure, index, type);
    updateStructure(updatedStructure);
  }
  
  // Trigger band functions - simplified
  function updateTriggerBandThickness(thickness: number) {
    if (!activeStructure) return;
    
    const updatedStructure = {
      ...activeStructure,
      triggerBand: {
        ...activeStructure.triggerBand,
        thickness
      },
      lastModified: new Date().toISOString()
    };
    
    updateStructure(updatedStructure);
  }
  
  function addPointToTriggerBand(point: Point) {
    if (!activeStructure) return;
    
    const updatedStructure = {
      ...activeStructure,
      triggerBand: {
        ...activeStructure.triggerBand,
        points: [...activeStructure.triggerBand.points, point]
      },
      lastModified: new Date().toISOString()
    };
    
    updateStructure(updatedStructure);
  }
  
  const value = {
    // Structure state
    structures,
    activeStructureId,
    activeStructure,
    setActiveStructureId,
    addStructure,
    updateStructure,
    refreshStructures,
    deleteStructure,
    
    // Map state
    mapState,
    setMapState,
    mapMode,
    setMapMode,
    
    // Point manipulation
    addPointToStructure,
    movePointInStructure,
    deletePointFromStructure,
    
    // Trigger band
    updateTriggerBandThickness,
    addPointToTriggerBand
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}