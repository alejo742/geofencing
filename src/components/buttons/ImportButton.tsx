'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { importData } from '@/utils/exportUtils';
import { Structure } from '@/types';
import { Upload, Loader2 } from 'lucide-react';

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
          <Loader2 className="animate-spin h-5 w-5 mr-2 text-gray-600" />
        ) : (
          <Upload className="h-5 w-5 mr-2 text-gray-600" />
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