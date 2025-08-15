'use client';

import { useEffect, useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import DynamicMap from '@/components/map/DynamicMapView';
import StructureList from '@/components/StructureList';
import StructureDetails from '@/components/StructureDetails';
import HierarchyManager from '@/components/HierarchyManager';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
  // Track if window is mobile size
  const [isMobile, setIsMobile] = useState(false);
  // Track if sidebar is open (for mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Add client-side rendering flag
  const [isClient, setIsClient] = useState(false);
  // Hierarchy manager state
  const [hierarchyManagerOpen, setHierarchyManagerOpen] = useState(false);

  // Handle resize to check if mobile and set client-side flag
  useEffect(() => {
    setIsClient(true);
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <main className="flex flex-col h-screen w-screen overflow-hidden">
          {/* Header */}
          <header className="bg-green-700 text-white p-4 shadow-md z-10 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">Evergreen Geofencing Tool</h1>
              <div className="flex items-center space-x-4">
                {/* Hierarchy Manager Button */}
                <button
                  onClick={() => setHierarchyManagerOpen(true)}
                  className="px-3 py-1 bg-green-800 hover:bg-green-900 rounded text-sm"
                >
                  Hierarchy
                </button>
                {/* Mobile toggle button - only shown on client */}
                {isClient && isMobile && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded bg-green-800 hover:bg-green-900"
                  >
                    {sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                  </button>
                )}
              </div>
            </div>
          </header>
          
          {/* Main content - adjusted to take full height */}
          <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]"> {/* Subtract header height */}
            {/* Sidebar - conditionally shown on mobile */}
            <aside 
              className={`bg-white border-r border-gray-200 w-96 flex-shrink-0 flex flex-col overflow-hidden
                        ${isClient && isMobile ? 'absolute top-16 bottom-0 z-25 shadow-lg transition-transform duration-300 ease-in-out ' + 
                                     (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
            >
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">Structures</h2>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <StructureList closeSidebar={() => setSidebarOpen(false)} />
              </div>
              
              <div className="border-t border-gray-200 flex-shrink-0">
                <StructureDetails />
              </div>
            </aside>
            
            <div className="flex-1 relative h-full">
              <DynamicMap />
            </div>
          </div>
          
          {/* Hierarchy Manager Modal */}
          <HierarchyManager 
            isOpen={hierarchyManagerOpen}
            onClose={() => setHierarchyManagerOpen(false)}
          />
        </main>
      </AppProvider>
    </ErrorBoundary>
  );
}