'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { formatDate } from '@/utils/formatters';
import { capitalizeStructureType } from '@/types';
import NewStructureForm from './NewStructureForm';

interface StructureListProps {
  closeSidebar?: () => void;
}

export default function StructureList({ closeSidebar }: StructureListProps) {
  const {
    structures,
    activeStructureCode,
    setActiveStructureCode,
    deleteStructure,
    getStructureHierarchy,
    getStructureRelationships
  } = useApp();

  const [isClient, setIsClient] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [structuresPerPage] = useState(20); // Show 20 structures per page

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSelectStructure = (code: string) => {
    setActiveStructureCode(code);
    if (closeSidebar) closeSidebar();
  };

  const toggleExpanded = (code: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedNodes(newExpanded);
  };

  // Search functionality with pagination
  const filteredHierarchy = () => {
    let hierarchy;
    
    if (!searchQuery.trim()) {
      hierarchy = getStructureHierarchy();
    } else {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (structure: any) => {
        const nameScore = structure.name.toLowerCase().includes(query) ? 3 : 0;
        const codeScore = structure.code.toLowerCase().includes(query) ? 2 : 0;
        const descScore = structure.description.toLowerCase().includes(query) ? 1 : 0;
        return nameScore + codeScore + descScore > 0;
      };
      
      // Filter and flatten hierarchy for search results
      const allStructures = structures.filter(matchesSearch);
      hierarchy = allStructures.map(structure => ({
        structure,
        children: [],
        depth: 0
      }));
    }
    
    // Apply pagination only if not searching (search shows all results)
    if (!searchQuery.trim()) {
      const startIndex = (currentPage - 1) * structuresPerPage;
      const endIndex = startIndex + structuresPerPage;
      return hierarchy.slice(startIndex, endIndex);
    }
    
    return hierarchy;
  };

  // Calculate pagination info
  const totalStructures = searchQuery.trim() ? 
    structures.filter(s => {
      const query = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(query) || 
             s.code.toLowerCase().includes(query) || 
             s.description.toLowerCase().includes(query);
    }).length :
    getStructureHierarchy().length;
    
  const totalPages = Math.ceil(totalStructures / structuresPerPage);
  const showPagination = !searchQuery.trim() && totalPages > 1;

  const renderStructureHierarchy = (hierarchy: any[], depth = 0) => {
    return hierarchy.map(node => (
      <div key={node.structure.code}>
        <div
          className={`p-3 rounded cursor-pointer transition-colors ${
            node.structure.code === activeStructureCode
              ? 'bg-green-100 border-l-4 border-green-600'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1" onClick={() => handleSelectStructure(node.structure.code)}>
              <div className="flex items-center">
                {node.children.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(node.structure.code);
                    }}
                    className="mr-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {expandedNodes.has(node.structure.code) ? '▼' : '▶'}
                  </button>
                )}
                {node.children.length === 0 && <span className="ml-6"></span>}
                <div>
                  <h3 className="font-medium text-gray-900">{node.structure.name}</h3>
                  <p className="text-xs text-gray-500">
                    {capitalizeStructureType(node.structure.type)} • {node.structure.code}
                    {node.structure.parentId && ' • Child structure'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last modified: {formatDate(node.structure.lastModified)}
                  </p>
                  <div className="flex space-x-2 mt-1 text-xs text-gray-600">
                    <span>{node.structure.mapPoints.length} map points</span>
                    <span>•</span>
                    <span>{node.structure.walkPoints.length} walk points</span>
                    {node.children.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{node.children.length} child structures</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const relationships = getStructureRelationships(node.structure.code);
                const hasChildren = relationships.children.length > 0;
                const confirmMessage = hasChildren 
                  ? `Delete structure "${node.structure.name}" and all ${relationships.children.length} child structures?`
                  : `Delete structure "${node.structure.name}"?`;
                
                if (confirm(confirmMessage)) {
                  deleteStructure(node.structure.code);
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
        {expandedNodes.has(node.structure.code) && renderStructureHierarchy(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="p-4">
      <NewStructureForm />
      
      {/* Search Input */}
      <div className="mt-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search structures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {searchQuery && (
          <p className="mt-1 text-xs text-gray-500">
            {filteredHierarchy().length === 0 ? 'No structures found' : `${filteredHierarchy().length} structures found`}
          </p>
        )}
        {showPagination && (
          <p className="mt-1 text-xs text-gray-500">
            Showing {((currentPage - 1) * structuresPerPage) + 1} - {Math.min(currentPage * structuresPerPage, totalStructures)} of {totalStructures} structures
          </p>
        )}
      </div>
      
      {isClient && (
        <div className="space-y-2">
          {structures.length === 0 ? (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded">
              No structures yet. Create one to get started!
            </div>
          ) : (
            renderStructureHierarchy(filteredHierarchy())
          )}
        </div>
      )}
      
      {/* Pagination Controls */}
      {showPagination && isClient && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-1 text-sm border rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
      {!isClient && (
        <div className="space-y-2 animate-pulse">
          <div className="p-4 bg-gray-100 rounded h-16"></div>
          <div className="p-4 bg-gray-100 rounded h-16"></div>
        </div>
      )}
    </div>
  );
}