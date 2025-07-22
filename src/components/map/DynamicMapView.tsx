'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type L from 'leaflet';
import { TestingData } from '../simulation/TestingMode';

// Dynamic imports for components that use Leaflet
const StructureLayer = dynamic(() => import('./StructureLayer'), { ssr: false });
const MapControls = dynamic(() => import('./MapControls'), { ssr: false });
const ImportButton = dynamic(() => import('../buttons/ImportButton'), { ssr: false });
const ExportButton = dynamic(() => import('../buttons/ExportButton'), { ssr: false });
const LayerControls = dynamic(() => import('./LayerControls'), { ssr: false });
const TestingMode = dynamic(() => import('../simulation/TestingMode'), { ssr: false });

// Define the props type that MapView expects
interface MapViewProps {
  onMapReady?: (map: L.Map) => void;
}

// Dynamically import the MapView component with no SSR
const DynamicMapView = dynamic<MapViewProps>(
  () => import('./MapView'), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Loading Map...</p>
        </div>
      </div>
    )
  }
);

export default function Map(props: { testingData: TestingData }) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const handleMapReady = (map: L.Map) => {
    setMapInstance(map);
    props.testingData.map = mapInstance;
  };
  
  return (
    <div className="relative w-full h-full flex-grow">
      <DynamicMapView onMapReady={handleMapReady} />
      
      {mapInstance && (
        <>
          {/* Map layers and interactive elements */}
          <StructureLayer map={mapInstance} />
          
          {/* Control panels */}
          <MapControls map={mapInstance} />
          <LayerControls />
          <TestingMode {...props.testingData} />
          
          {/* Import/Export buttons in the top-right */}
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
            <ImportButton />
            <ExportButton />
          </div>
        </>
      )}
    </div>
  );
}