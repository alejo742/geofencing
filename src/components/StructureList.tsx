'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { formatDate } from '@/utils/formatters';

interface StructureListProps {
  closeSidebar?: () => void;
}

export default function StructureList({ closeSidebar }: StructureListProps) {
  const { 
    structures, 
    activeStructureId, 
    setActiveStructureId,
    addStructure,
    deleteStructure
  } = useApp();
  
  const [newStructureName, setNewStructureName] = useState('');
  // Add this state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after first render
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleAddStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStructureName.trim()) {
      addStructure(newStructureName.trim());
      setNewStructureName('');
    }
  };
  
  const handleSelectStructure = (id: string) => {
    setActiveStructureId(id);
    if (closeSidebar) {
      closeSidebar();
    }
  };
  
  return (
    <div className="p-4">
      {/* Add new structure form */}
      <form onSubmit={handleAddStructure} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newStructureName}
            onChange={(e) => setNewStructureName(e.target.value)}
            placeholder="New structure name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </form>
      
      {/* Structure list - Only show when client-side rendering is active */}
      {isClient && (
        <div className="space-y-2">
          {structures.length === 0 ? (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded">
              No structures yet. Create one to get started!
            </div>
          ) : (
            structures.map(structure => (
              <div 
                key={structure.id}
                onClick={() => handleSelectStructure(structure.id)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  structure.id === activeStructureId
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{structure.name}</h3>
                    <p className="text-xs text-gray-500">
                      Last modified: {formatDate(structure.lastModified)}
                    </p>
                    <div className="flex space-x-2 mt-1 text-xs text-gray-600">
                      <span>{structure.mapPoints.length} map points</span>
                      <span>•</span>
                      <span>{structure.walkPoints.length} walk points</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete structure "${structure.name}"?`)) {
                        deleteStructure(structure.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Delete structure"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Show loading placeholder during server rendering */}
      {!isClient && (
        <div className="space-y-2 animate-pulse">
          <div className="p-4 bg-gray-100 rounded h-16"></div>
          <div className="p-4 bg-gray-100 rounded h-16"></div>
        </div>
      )}
    </div>
  );
}