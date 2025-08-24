'use client';

import { useApp } from '@/hooks/useApp';
import { formatDate, formatArea } from '@/utils/formatters';
import { calculateAreaInSquareMeters } from '@/utils/mapUtils';
import { useState, useEffect } from 'react';
import { STRUCTURE_TYPES, StructureType } from '@/types';
import { capitalizeStructureType } from '@/utils/structUtils';
import SearchableSelect from './ui/SearchableSelect';

export default function StructureDetails() {
  const { 
    activeStructure, 
    updateStructure, 
    structures,
    getStructureRelationships,
    setStructureParent,
    canSetAsParent,
    setActiveStructureCode
  } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<StructureType>('academic');
  const [parentId, setParentId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize edit form when active structure changes
  useEffect(() => {
    if (activeStructure) {
      setName(activeStructure.name ?? '');
      setDescription(activeStructure.description ?? '');
      setCode(activeStructure.code ?? '');
      setType(activeStructure.type ?? 'academic');
      setParentId(activeStructure.parentId ?? '');
    }
    setIsEditing(false);
  }, [activeStructure]);

  // Don't render real content during SSR
  if (!isClient) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded mb-3"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!activeStructure) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a structure to view details
      </div>
    );
  }

  // Calculate area if we have enough points
  const area = activeStructure.mapPoints.length >= 3 
    ? calculateAreaInSquareMeters(activeStructure.mapPoints)
    : 0;

  const handleSaveDetails = () => {
    if (name.trim() && code.trim() && description.trim() && type && activeStructure) {
      // Update the structure properties
      updateStructure({
        ...activeStructure,
        name: name.trim(),
        description: description.trim(),
        code: code.trim(),
        type: type,
        parentId: parentId || undefined
      });
      
      // Set the parent relationship if it changed
      if ((parentId || null) !== (activeStructure.parentId || null)) {
        setStructureParent(activeStructure.code, parentId || null);
      }
      
      setIsEditing(false);
    }
  };

  // Get relationships for the active structure
  const relationships = activeStructure ? getStructureRelationships(activeStructure.code) : null;

  // Get available parent options (exclude self, children, and descendants)
  const getAvailableParents = () => {
    if (!activeStructure) return [];
    return structures.filter(s => 
      s.code !== activeStructure.code && // Not self
      canSetAsParent(activeStructure.code, s.code) // No circular dependency
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        {isEditing ? (
          <form className="flex flex-col space-y-4 w-full" onSubmit={e => { e.preventDefault(); handleSaveDetails(); }}>
            <div className="flex flex-col space-y-1">
              <label htmlFor="structure-name" className="text-xs font-medium text-gray-700">Name</label>
              <input
                id="structure-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
                placeholder="Structure Name"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="structure-code" className="text-xs font-medium text-gray-700">Code</label>
              <input
                id="structure-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Unique Code/Identifier"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="structure-type" className="text-xs font-medium text-gray-700">Type</label>
              <select
                id="structure-type"
                value={type}
                onChange={(e) => setType(e.target.value as StructureType)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {STRUCTURE_TYPES.map(structureType => (
                  <option key={structureType} value={structureType}>
                    {capitalizeStructureType(structureType)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="structure-parent" className="text-xs font-medium text-gray-700">Parent Structure</label>
              <SearchableSelect
                structures={getAvailableParents()}
                value={parentId}
                onChange={(newParentId) => {
                  console.log('StructureDetails: parentId changing from', parentId, 'to', newParentId);
                  setParentId(newParentId);
                }}
                placeholder="Search parent structures..."
                excludeCode={activeStructure?.code}
                maxDisplayItems={5}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="structure-description" className="text-xs font-medium text-gray-700">Description</label>
              <textarea
                id="structure-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Description"
                rows={2}
              />
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                type="submit"
                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(activeStructure.name ?? '');
                  setDescription(activeStructure.description ?? '');
                  setCode(activeStructure.code ?? '');
                  setType(activeStructure.type ?? 'academic');
                  setParentId(activeStructure.parentId ?? '');
                  setIsEditing(false);
                }}
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">{activeStructure.name}</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Edit
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Code:</span> {activeStructure.code || <span className="italic text-gray-400">No code</span>}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Type:</span> {capitalizeStructureType(activeStructure.type)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Description:</span> {activeStructure.description || <span className="italic text-gray-400">No description</span>}
            </div>
            
            {/* Parent-Child Relationship Info */}
            {relationships && (
              <div className="mt-2 space-y-1">
                {relationships.parent && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Parent:</span>{' '}
                    <button
                      onClick={() => setActiveStructureCode(relationships.parent!.code)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {relationships.parent.name} ({relationships.parent.code})
                    </button>
                  </div>
                )}
                
                {relationships.children.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Children ({relationships.children.length}):</span>
                    <div className="ml-2 mt-1">
                      {relationships.children.map(child => (
                        <div key={child.code}>
                          <button
                            onClick={() => setActiveStructureCode(child.code)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {child.name} ({child.code})
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {relationships.siblings.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Siblings ({relationships.siblings.length}):</span>
                    <div className="ml-2 mt-1">
                      {relationships.siblings.map(sibling => (
                        <div key={sibling.code}>
                          <button
                            onClick={() => setActiveStructureCode(sibling.code)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {sibling.name} ({sibling.code})
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        Last modified: {formatDate(activeStructure.lastModified)}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Map Points</div>
          <div className="text-2xl font-bold text-green-600">
            {activeStructure.mapPoints.length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Walk Points</div>
          <div className="text-2xl font-bold text-blue-600">
            {activeStructure.walkPoints.length}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Trigger Points</div>
          <div className="text-2xl font-bold text-purple-600">
            {activeStructure.triggerBand?.points.length || 0}
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded">
          <div className="font-medium text-gray-700">Area</div>
          <div className="text-2xl font-bold text-amber-600">
            {area > 0 ? formatArea(area) : 'N/A'}
          </div>
        </div>
      </div>

      {activeStructure.mapPoints.length < 3 && (
        <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-xs rounded">
          Add at least 3 map points to create a complete structure.
        </div>
      )}
    </div>
  );
}