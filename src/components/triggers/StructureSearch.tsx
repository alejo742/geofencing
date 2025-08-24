'use client';

import { useState, useMemo } from 'react';
import { Structure } from '@/types';
import { capitalizeStructureType } from '@/utils/structUtils';

interface StructureSearchProps {
  structures: Structure[];
  onStructureSelect: (structure: Structure) => void;
  selectedStructureCode?: string;
  placeholder?: string;
  className?: string;
}

export default function StructureSearch({
  structures,
  onStructureSelect,
  selectedStructureCode,
  placeholder = "Search structures...",
  className = ""
}: StructureSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter structures based on search query
  const filteredStructures = useMemo(() => {
    if (!searchQuery.trim()) {
      return structures.slice(0, 20); // Show first 20 when no search
    }

    const query = searchQuery.toLowerCase();
    return structures
      .filter(structure => 
        structure.name.toLowerCase().includes(query) ||
        structure.code.toLowerCase().includes(query) ||
        structure.description.toLowerCase().includes(query) ||
        structure.type.toLowerCase().includes(query)
      )
      .slice(0, 20); // Limit results
  }, [structures, searchQuery]);

  const selectedStructure = structures.find(s => s.code === selectedStructureCode);

  const handleStructureSelect = (structure: Structure) => {
    onStructureSelect(structure);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display selected structure */}
      {selectedStructure && !isOpen && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800">{selectedStructure.name}</h4>
              <p className="text-sm text-green-600">
                {selectedStructure.code} • {capitalizeStructureType(selectedStructure.type)}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(true);
                setSearchQuery('');
              }}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Search input */}
      {(!selectedStructure || isOpen) && (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              onFocus={() => setIsOpen(true)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Search results dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredStructures.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {searchQuery ? `${filteredStructures.length} results` : 'Recent structures'}
                  </div>
                  {filteredStructures.map((structure) => (
                    <button
                      key={structure.code}
                      onClick={() => handleStructureSelect(structure)}
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{structure.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{structure.code}</span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {capitalizeStructureType(structure.type)}
                            </span>
                          </div>
                          {structure.description && (
                            <p className="text-sm text-gray-500 mt-1 truncate">{structure.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                  {searchQuery && filteredStructures.length === 20 && (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center border-t border-gray-100">
                      Showing first 20 results. Try a more specific search.
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3 py-8 text-center text-gray-500">
                  <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No structures found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
