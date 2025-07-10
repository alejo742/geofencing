'use client';
import { useState, useEffect } from 'react';

/**
 * Custom hook to manage localStorage with optional custom load and save functions.
 * @param key The key under which the value is stored in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @param loadFn Optional function to load the value from a custom source.
 * @param saveFn Optional function to save the value to a custom source.
 * @returns A tuple containing the stored value and a setter function to update it.
 */
export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  loadFn?: () => T,
  saveFn?: (value: T) => void
): [T, (value: T) => void] {
  // Initialize state with a function to avoid running the logic on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Don't run this on the server
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Try to use custom loader first
      if (loadFn) {
        return loadFn();
      }
      
      // Otherwise use localStorage
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return initialValue;
    }
  });
  
  // Separate effect for saving to storage when value changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Use custom save function if provided
      if (saveFn) {
        saveFn(storedValue);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [key, storedValue, saveFn]);
  
  return [storedValue, setStoredValue];
}