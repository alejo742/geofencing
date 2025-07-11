'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type L from 'leaflet';

// Dynamic imports for components that use Leaflet
const StructureLayer = dynamic(() => import('./StructureLayer'), { ssr: false });
const PointActions = dynamic(() => import('./PointActions'), { ssr: false });
const WalkControls = dynamic(() => import('./WalkControls'), { ssr: false });
const TriggerBandControls = dynamic(() => import('./TriggerBandControls'), { ssr: false });

// Define the props type that MapView expects
interface MapViewProps {
  onMapReady?: (map: L.Map) => void;
}

// Dynamically import the MapView component with no SSR
const DynamicMapView = dynamic<MapViewProps>(
  () => import('./MapView'), 
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }
);

export default function Map() {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const handleMapReady = (map: L.Map) => {
    setMapInstance(map);
  };
  
  return (
    <div className="relative w-full h-full flex-grow">
      <DynamicMapView onMapReady={handleMapReady} />
      {mapInstance && (
        <>
          <StructureLayer map={mapInstance} />
          <PointActions map={mapInstance} />
          <WalkControls map={mapInstance} />
          <TriggerBandControls map={mapInstance} />
        </>
      )}
    </div>
  );
}