'use client';

import { useState, useRef, useEffect } from 'react';
import { Structure } from '@/types';

interface SearchableSelectProps {
  structures: Structure[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  excludeCode?: string; // To exclude current structure from options
  maxDisplayItems?: number;
}

export default function SearchableSelect({
  structures,
  value,
  onChange,
  placeholder = "Search structures...",
  excludeCode,
  maxDisplayItems = 5
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter structures based on search query and exclude criteria
  const filteredStructures = structures
    .filter(s => excludeCode ? s.code !== excludeCode : true)
    .filter(s => 
      searchQuery === '' || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Show first maxDisplayItems if no search, or all filtered results if searching
  const displayStructures = searchQuery === '' 
    ? filteredStructures.slice(0, maxDisplayItems)
    : filteredStructures;

  // Get selected structure for display
  const selectedStructure = structures.find(s => s.code === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < displayStructures.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && displayStructures[highlightedIndex]) {
          onChange(displayStructures[highlightedIndex].code);
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (structureCode: string) => {
    onChange(structureCode);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display/Input Area */}
      <div 
        className="w-full p-2 border border-gray-300 rounded cursor-pointer bg-white flex items-center justify-between"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        {selectedStructure ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm">
              {selectedStructure.name} ({selectedStructure.code})
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No Parent (Root Structure)</span>
        )}
        <div className="ml-2 text-gray-400">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              className={`w-full text-left p-2 cursor-pointer text-sm border-b border-gray-100 hover:bg-gray-50 ${
                highlightedIndex === -1 ? 'bg-blue-50' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
            >
              <span className="text-gray-600">No Parent (Root Structure)</span>
            </button>

            {displayStructures.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                {searchQuery ? 'No structures found' : 'No available structures'}
              </div>
            ) : (
              displayStructures.map((structure, index) => (
                <button
                  key={structure.code}
                  type="button"
                  className={`w-full text-left p-2 cursor-pointer text-sm hover:bg-gray-50 ${
                    highlightedIndex === index ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(structure.code);
                  }}
                >
                  <div className="font-medium">{structure.name}</div>
                  <div className="text-xs text-gray-500">
                    {structure.code} • {structure.type}
                  </div>
                </button>
              ))
            )}

            {/* Show count if more items available */}
            {searchQuery === '' && filteredStructures.length > maxDisplayItems && (
              <div className="p-2 text-xs text-gray-500 text-center border-t border-gray-100">
                {filteredStructures.length - maxDisplayItems} more structures available. Use search to find them.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
