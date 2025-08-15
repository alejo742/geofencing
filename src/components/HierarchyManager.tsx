'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { Structure } from '@/types';
import SearchableSelect from './ui/SearchableSelect';

interface HierarchyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HierarchyManager({ isOpen, onClose }: HierarchyManagerProps) {
  const { 
    structures, 
    setStructureParent, 
    canSetAsParent, 
    getStructureHierarchy,
    getStructureRelationships 
  } = useApp();
  
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [newParentId, setNewParentId] = useState<string>('');

  useEffect(() => {
    if (selectedStructure) {
      setNewParentId(selectedStructure.parentId || '');
    }
  }, [selectedStructure]);

  const handleParentChange = () => {
    if (selectedStructure) {
      setStructureParent(selectedStructure.code, newParentId || null);
      setSelectedStructure(null);
      setNewParentId('');
    }
  };

  const getAvailableParents = (structureCode: string) => {
    return structures.filter(s => 
      s.code !== structureCode && 
      canSetAsParent(structureCode, s.code)
    );
  };

  const renderHierarchyTree = () => {
    const hierarchy = getStructureHierarchy();
    
    const renderNode = (node: any, depth = 0) => (
      <div key={node.structure.code} className="ml-4" style={{ marginLeft: `${depth * 20}px` }}>
        <div className="flex items-center justify-between p-2 border rounded mb-1 bg-white">
          <div className="flex items-center">
            {depth > 0 && <span className="text-gray-400 mr-2">└─</span>}
            <span className="font-medium">{node.structure.name}</span>
            <span className="text-gray-500 ml-2">({node.structure.code})</span>
            {node.children.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                {node.children.length} children
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedStructure(node.structure)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit Parent
          </button>
        </div>
        {node.children.map((child: any) => renderNode(child, depth + 1))}
      </div>
    );

    return hierarchy.map(node => renderNode(node));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Structure Hierarchy Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Hierarchy Tree */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Current Hierarchy</h3>
          <div className="border rounded p-4 bg-gray-50 max-h-60 overflow-auto">
            {structures.length === 0 ? (
              <p className="text-gray-500 text-center">No structures available</p>
            ) : (
              renderHierarchyTree()
            )}
          </div>
        </div>

        {/* Parent Editor */}
        {selectedStructure && (
          <div className="border rounded p-4 bg-blue-50">
            <h3 className="font-semibold mb-3">
              Edit Parent for: {selectedStructure.name} ({selectedStructure.code})
            </h3>
            
            <div className="flex flex-col space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select New Parent:
                </label>
                <SearchableSelect
                  structures={getAvailableParents(selectedStructure.code)}
                  value={newParentId}
                  onChange={setNewParentId}
                  placeholder="Search parent structures..."
                  excludeCode={selectedStructure.code}
                  maxDisplayItems={5}
                />
              </div>

              {/* Current Relationships Info */}
              <div className="text-sm text-gray-600">
                {(() => {
                  const relationships = getStructureRelationships(selectedStructure.code);
                  return (
                    <div>
                      {relationships.parent && (
                        <p>Current Parent: {relationships.parent.name} ({relationships.parent.code})</p>
                      )}
                      {relationships.children.length > 0 && (
                        <p>Children: {relationships.children.length}</p>
                      )}
                      {relationships.descendants.length > 0 && (
                        <p>Total Descendants: {relationships.descendants.length}</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleParentChange}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Update Parent
                </button>
                <button
                  onClick={() => {
                    setSelectedStructure(null);
                    setNewParentId('');
                  }}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-lg font-bold text-green-600">
              {structures.filter(s => !s.parentId).length}
            </div>
            <div className="text-sm text-gray-600">Root Structures</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-lg font-bold text-blue-600">
              {structures.filter(s => s.parentId).length}
            </div>
            <div className="text-sm text-gray-600">Child Structures</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-lg font-bold text-purple-600">
              {getStructureHierarchy().length}
            </div>
            <div className="text-sm text-gray-600">Top-Level Trees</div>
          </div>
        </div>
      </div>
    </div>
  );
}
