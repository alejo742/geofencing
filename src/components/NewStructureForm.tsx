'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';

export default function NewStructureForm() {
  const [name, setName] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { addStructure } = useApp();
  
  // Add client-side only rendering
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      addStructure(name.trim());
      setName('');
      setIsFormOpen(false);
    }
  };
  
  if (!isClient) {
    return (
      <div className="mt-4 mb-6">
        <button
          disabled
          className="w-full bg-gray-300 text-white py-2 px-4 rounded"
        >
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-6">
      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          + New Structure
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-3 rounded shadow">
          <label className="block mb-2 text-sm font-medium">
            Structure Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mt-1 border rounded"
              placeholder="e.g., Baker Library"
              autoFocus
            />
          </label>
          <div className="flex space-x-2 mt-3">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 py-1 px-3 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}