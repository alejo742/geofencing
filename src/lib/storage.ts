import { Structure } from "@/types";

// Key used for storing structures in localStorage
const STORAGE_KEY = 'evergreen_geofence_structures';

/**
 * Saves structures to localStorage
 * @param structures - Array of Structure objects to save
 */
export function saveStructures(structures: Structure[]): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  try {
    const jsonData = JSON.stringify(structures);
    localStorage.setItem(STORAGE_KEY, jsonData);
  } catch (error) {
    console.error('Failed to save structures to localStorage:', error);
  }
}

/**
 * Loads structures from localStorage
 * @returns Array of Structure objects
 */
export function loadStructures(): Structure[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return [];
  
  try {
    const jsonData = localStorage.getItem(STORAGE_KEY);
    
    // If no data exists yet, return empty array
    if (!jsonData) {
      return [];
    }
    
    // Parse the data from JSON to Structure[]
    return JSON.parse(jsonData) as Structure[];
  } catch (error) {
    console.error('Failed to load structures from localStorage:', error);
    return [];
  }
}