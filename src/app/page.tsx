'use client';

import { useEffect, useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import DynamicMap from '@/components/map/DynamicMapView';
import StructureList from '@/components/StructureList';
import StructureDetails from '@/components/StructureDetails';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TestingData } from '@/components/simulation/TestingMode';

export default function Home() {
  // Track if window is mobile size
  const [isMobile, setIsMobile] = useState(false);
  // Track if sidebar is open (for mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Add client-side rendering flag
  const [isClient, setIsClient] = useState(false);
  // Testing mode state
  const [testingData, setTestingData] = useState<TestingData>({
    isActive: false,
    boundaryType: 'trigger',
    map: null
  });

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
          </header>
          
          {/* Main content - adjusted to take full height */}
          <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]"> {/* Subtract header height */}
            {/* Sidebar - conditionally shown on mobile */}
            <aside 
              className={`bg-white border-r border-gray-200 w-80 flex-shrink-0 flex flex-col overflow-hidden
                        ${isClient && isMobile ? 'absolute top-16 bottom-0 z-25 shadow-lg transition-transform duration-300 ease-in-out ' + 
                                     (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
            >
              <div className='flex-col gap-2'>
                <div className='py-4 flex justify-center items-center gap-2'>
                  <input type="checkbox" name="toggle-testing" id="toggle-testing" onChange={() => {
                    setTestingData(prev => ({
                      ...prev,
                      isActive: !prev.isActive
                    }));
                  }} className='toggle-testing w-6 h-6 cursor-pointer accent-green-500' />
                  <label className='text-md' htmlFor='toggle-testing'>Turn on Testing Mode? (beta)</label>
                </div>
                {/* Select which boundary we should use */}
                <div className='pb-2 flex justify-center items-center gap-2'>
                  <select 
                    name="boundary-type" 
                    id="boundary-type" 
                    className='border border-gray-300 rounded p-2'
                    defaultValue={"trigger"}
                    onChange={(e) => {
                      setTestingData(prev => ({
                        ...prev,
                        boundaryType: e.target.value as 'map' | 'walk' | 'trigger'
                      }));
                    }}
                  >
                    <option value="map">Map Boundary</option>
                    <option value="walk">Walk Boundary</option>
                    <option value="trigger">Trigger Boundary</option>
                  </select>
                </div>
              </div>
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
              <DynamicMap testingData={testingData} />
            </div>
          </div>
        </main>
      </AppProvider>
    </ErrorBoundary>
  );
}