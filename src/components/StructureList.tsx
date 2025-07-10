'use client';

import { useStructures } from '@/hooks/useStructures';

export default function StructureList() {
  const { 
    structures, 
    activeStructureId, 
    setActiveStructureId 
  } = useStructures();
  
  return (
    <div className="w-full md:w-64 bg-gray-100 p-4 overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Structures</h2>
      
      {structures.length === 0 ? (
        <p className="text-gray-500">No structures yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {structures.map(structure => (
            <li 
              key={structure.id}
              className={`p-2 rounded cursor-pointer ${
                structure.id === activeStructureId 
                  ? 'bg-green-200 border-l-4 border-green-600' 
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveStructureId(structure.id)}
            >
              <div className="font-medium">{structure.name}</div>
              <div className="text-xs text-gray-500">
                {new Date(structure.lastModified).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}