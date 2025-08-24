'use client';

import { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { Structure, Point, MapMode, MapViewState, StructureType, StructureHierarchy, StructureRelationship } from '@/types';
import { buildStructureHierarchy, getStructureRelationships, canSetParent } from '@/utils/structUtils';
import { saveStructures, loadStructures } from '@/lib/storage';
import { addMapPoint, movePoint, deletePoint } from '@/utils/mapUtils';
import { updateTriggerThickness } from '@/utils/geoUtils';

// Default map state
const DEFAULT_MAP_STATE: MapViewState = {
  center: { lat: 43.7044, lng: -72.2887 }, // Default to Dartmouth College
  zoom: 16
};

// Define the context type
type AppContextType = {
  // Structure-related state
  structures: Structure[];
  activeStructureCode: string | null;
  activeStructure: Structure | null;
  setActiveStructureCode: (code: string | null) => void;
  addStructure: (name: string, code: string, description: string, type: StructureType, parentCode?: string) => Structure;
  isCodeUnique: (code: string) => boolean;
  updateStructure: (structure: Structure) => void;
  refreshStructures: () => Structure[];
  deleteStructure: (code: string) => void;
  
  // Hierarchy-related functions
  getStructureHierarchy: () => StructureHierarchy[];
  getStructureRelationships: (structureCode: string) => StructureRelationship;
  setStructureParent: (structureCode: string, parentCode: string | null) => void;
  canSetAsParent: (childCode: string, parentCode: string) => boolean;
  getRootStructures: () => Structure[];
  getChildStructures: (parentCode: string) => Structure[];
  
  // Map-related state
  mapState: MapViewState;
  setMapState: (state: MapViewState) => void;
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;
  
  // Point manipulation functions
  addPointToStructure: (point: Point, type: 'map' | 'walk') => void;
  movePointInStructure: (index: number, newPos: Point, type: 'map' | 'walk') => void;
  deletePointFromStructure: (index: number, type: 'map' | 'walk') => void;
  undoLastAction: () => void;
  canUndo: boolean;
  
  // Trigger band functions
  updateTriggerBandThickness: (thickness: number) => void;
  addPointToTriggerBand: (point: Point) => void;
  updateTriggerBand: (points: Point[]) => void;
  
  // Import/Export functions
  saveImportedStructures: (structures: Structure[]) => void;
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
  
  const [activeStructureCode, setActiveStructureCode] = useState<string | null>(() => {
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

  const [actionHistory, setActionHistory] = useState<Array<{
    type: string;
    structureCode: string;
    data: any;
  }>>([]);
  
  // Find the active structure
  const activeStructure = structures.find(s => s.code === activeStructureCode) || null;
  
  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory[actionHistory.length - 1];
    const structure = structures.find(s => s.code === lastAction.structureCode);
    
    if (!structure) return;
    
    let updatedStructure;
    
    switch (lastAction.type) {
      case 'ADD_MAP_POINT':
        // Remove the last added map point
        const updatedMapPoints = structure.mapPoints.slice(0, -1);
        updatedStructure = {
          ...structure,
          mapPoints: updatedMapPoints,
          triggerBand: updatedMapPoints.length < 3 ?
            { ...structure.triggerBand, points: []} :
            structure.triggerBand // replace with empty band if less than 3 points
        };
        break;
        
      case 'ADD_WALK_POINT':
        // Remove the last added walk point
        const updatedWalkPoints = structure.walkPoints.slice(0, -1);
        updatedStructure = {
          ...structure,
          walkPoints: updatedWalkPoints,
          triggerBand: updatedWalkPoints.length < 3 ?
            { ...structure.triggerBand, points: []} :
            structure.triggerBand // replace with empty band if less than 3 points
        };
        break;
        
      case 'ADD_TRIGGER_POINT':
        // Remove the last added trigger point
        if (structure.triggerBand) {
          updatedStructure = {
            ...structure,
            triggerBand: {
              ...structure.triggerBand,
              points: structure.triggerBand.points.slice(0, -1)
            }
          };
        }
        break;
      default:
        return;
    }
    
    // Update the structure
    if (updatedStructure) {
      updateStructure(updatedStructure);
    }
    
    // Remove the action from history
    setActionHistory(prev => prev.slice(0, -1));
  }, [actionHistory, structures]);  
  
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
  
  // Save active structure code whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('evergreen_active_structure', JSON.stringify(activeStructureCode));
      }
    } catch (error) {
      console.error('Failed to save active structure code:', error);
    }
  }, [activeStructureCode]);
  
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
  
  // Structure operations
  function refreshStructures() {
    try {
      const refreshedStructures = loadStructures();
      setStructures(refreshedStructures);
      
      if (typeof window !== 'undefined') {
        const storedActiveCode = localStorage.getItem('evergreen_active_structure');
        if (storedActiveCode) {
          setActiveStructureCode(JSON.parse(storedActiveCode));
        }
      }
      
      return refreshedStructures;
    } catch (error) {
      console.error('Failed to refresh structures:', error);
      return [];
    }
  }

  function isCodeUnique(code: string) {
    return !structures.some(s => s.code?.toLowerCase() === code.trim().toLowerCase());
  }

  function addStructure(name: string, code: string, description: string, type: StructureType, parentCode?: string) {
    // Ensure unique code
    let uniqueCode = code.trim().toUpperCase();
    const existingCodes = new Set(structures.map(s => s.code));
    
    let counter = 2;
    while (existingCodes.has(uniqueCode)) {
      uniqueCode = `${code.trim().toUpperCase()}${counter}`;
      counter++;
    }
    
    const newStructure: Structure = {
      code: uniqueCode,
      name,
      description,
      type,
      parentId: parentCode,
      mapPoints: [],
      walkPoints: [],
      triggerBand: {
        points: [],
        thickness: 5
      },
      lastModified: new Date().toISOString()
    };
  
    setStructures(prev => [...prev, newStructure]);
    setActiveStructureCode(newStructure.code);
  
    return newStructure;
  }
  
  function updateStructure(updatedStructure: Structure) {
    const updated = {
      ...updatedStructure,
      lastModified: new Date().toISOString()
    };
    
    setStructures(prev => 
      prev.map(s => s.code === updated.code ? updated : s)
    );
  }
  
  function deleteStructure(code: string) {
    // Get all descendant structures that need to be deleted
    const relationships = getStructureRelationships(code, structures);
    const allCodesToDelete = [code, ...relationships.descendants.map(d => d.code)];
    
    setStructures(prev => prev.filter(s => !allCodesToDelete.includes(s.code)));
    
    // If we're deleting the active structure, clear the active code
    if (allCodesToDelete.includes(activeStructureCode || '')) {
      setActiveStructureCode(null);
    }
  }
  
  // Point manipulation functions
  function addPointToStructure(point: Point, type: 'map' | 'walk') {
    if (!activeStructure) return;
    
    let updatedStructure;
    if (type === 'map') {
      updatedStructure = addMapPoint(activeStructure, point);
      
      // Add to history
      setActionHistory(prev => [...prev, {
        type: 'ADD_MAP_POINT',
        structureCode: activeStructure.code,
        data: point
      }]);
    } else {
      updatedStructure = {
        ...activeStructure,
        walkPoints: [...activeStructure.walkPoints, point],
        lastModified: new Date().toISOString()
      };
      
      // Add to history
      setActionHistory(prev => [...prev, {
        type: 'ADD_WALK_POINT',
        structureCode: activeStructure.code,
        data: point
      }]);
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

    if ((type === 'map' && updatedStructure.mapPoints.length === 0) || 
      (type === 'walk' && updatedStructure.walkPoints.length === 0)) {
    // If either polygon is now empty, clear the trigger band
    updatedStructure.triggerBand = {
      ...updatedStructure.triggerBand,
      points: []
    };
  }

    updateStructure(updatedStructure);
  }
  
  // Trigger band functions
  function updateTriggerBandThickness(thickness: number) {
    if (!activeStructure) return;
    
    const updatedStructure = updateTriggerThickness(activeStructure, thickness);
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
    
    // Add to history
    setActionHistory(prev => [...prev, {
      type: 'ADD_TRIGGER_POINT',
      structureCode: activeStructure.code,
      data: point
    }]);
    
    updateStructure(updatedStructure);
  }
  
  // New function to update trigger band with generated points
  function updateTriggerBand(points: Point[]) {
    if (!activeStructure) return;
    
    const updatedStructure = {
      ...activeStructure,
      triggerBand: {
        ...activeStructure.triggerBand,
        points
      },
      lastModified: new Date().toISOString()
    };
    
    updateStructure(updatedStructure);
  }
  
  // New function to save imported structures
  function saveImportedStructures(importedStructures: Structure[]) {
    
    // Generate new IDs for imported structures to avoid conflicts
    const structuresToAdd = importedStructures.map(structure => ({
      ...structure,
      id: crypto.randomUUID(), // Always generate a new ID
      lastModified: new Date().toISOString()
    }));
    
    // Add the imported structures to the existing ones
    setStructures(prev => [...prev, ...structuresToAdd]);
    
    // Select the first imported structure if available
    if (structuresToAdd.length > 0) {
      setActiveStructureCode(structuresToAdd[0].code);
    }
  }
  
  // Hierarchy management functions
  function getStructureHierarchyValue(): StructureHierarchy[] {
    return buildStructureHierarchy(structures);
  }
  
  function getStructureRelationshipsValue(structureId: string): StructureRelationship {
    return getStructureRelationships(structureId, structures);
  }
  
  function setStructureParent(structureCode: string, parentCode: string | null) {
    const structure = structures.find(s => s.code === structureCode);
    if (!structure) return;
    
    // Validate the parent assignment
    if (parentCode && !canSetParent(structureCode, parentCode, structures)) {
      console.error('Cannot set parent: would create a circular dependency');
      return;
    }
    
    const updatedStructure = {
      ...structure,
      parentId: parentCode || undefined,
      lastModified: new Date().toISOString()
    };
    
    updateStructure(updatedStructure);
  }
  
  function canSetAsParent(childId: string, parentId: string): boolean {
    return canSetParent(childId, parentId, structures);
  }
  
  function getRootStructures(): Structure[] {
    return structures.filter(s => !s.parentId);
  }
  
  function getChildStructures(parentCode: string): Structure[] {
    return structures.filter(s => s.parentId === parentCode);
  }
  
  const value = {
    // Structure state
    structures,
    activeStructureCode,
    activeStructure,
    setActiveStructureCode,
    addStructure,
    isCodeUnique,
    updateStructure,
    refreshStructures,
    deleteStructure,
    
    // Hierarchy functions
    getStructureHierarchy: getStructureHierarchyValue,
    getStructureRelationships: getStructureRelationshipsValue,
    setStructureParent,
    canSetAsParent,
    getRootStructures,
    getChildStructures,
    
    // Map state
    mapState,
    setMapState,
    mapMode,
    setMapMode,
    
    // Point manipulation
    addPointToStructure,
    movePointInStructure,
    deletePointFromStructure,
    undoLastAction,
    canUndo: actionHistory.length > 0,
    
    // Trigger band
    updateTriggerBandThickness,
    addPointToTriggerBand,
    updateTriggerBand,
    
    // Import/Export
    saveImportedStructures,
  };
  
  // Expose AppContext for debugging if needed
  if (typeof window !== 'undefined') {
    (window as any).__APP_CONTEXT__ = value;
  }
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}