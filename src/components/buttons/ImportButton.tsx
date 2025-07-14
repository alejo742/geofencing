'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { importData } from '@/utils/exportUtils';
import { Structure } from '@/types';

export default function ImportButton() {
  const { structures, refreshStructures, saveImportedStructures } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For tracking changes in structure count
  const [initialCount, setInitialCount] = useState(0);
  
  // Check if structures were actually added
  useEffect(() => {
    if (initialCount > 0 && structures.length > initialCount) {
      console.log(`Structures successfully imported: ${structures.length - initialCount} new structures`);
    }
  }, [structures.length, initialCount]);
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store current count to compare later
    setInitialCount(structures.length);
    
    // Reset states
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`Reading file: ${file.name} (${file.size} bytes)`);
      const text = await file.text();
      
      // Parse the structures
      const importedStructures = importData(text);
      
      if (importedStructures.length === 0) {
        setError('No valid structures found in the file.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Parsed ${importedStructures.length} structures`);
      
      // Save the structures and force a refresh
      saveImportedStructures(importedStructures);
      
      // Add a small delay to ensure state updates have time to process
      setTimeout(() => {
        refreshStructures();
        setSuccess(`Successfully imported ${importedStructures.length} structure(s)`);
        setIsLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Import error:', err);
      setError(`Failed to import file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-md border border-gray-300 hover:bg-gray-50 flex items-center"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 mr-2 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {isLoading ? 'Importing...' : 'Import'}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json,.geojson"
        className="hidden"
      />
      
      {(error || success) && (
        <div className="absolute right-0 mt-2 w-64 z-30 shadow-lg rounded-lg overflow-hidden">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">
              <div className="font-medium mb-1">Import Error</div>
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm border border-green-200">
              <div className="font-medium mb-1">Import Successful</div>
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}