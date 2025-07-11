interface Point {
  lat: number;
  lng: number;
}

interface TriggerBand {
  points: Point[];
  thickness: number; // Width in meters
}

interface Structure {
  id: string;           // UUID
  name: string;         // Building name
  mapPoints: Point[];   // Manually clicked points
  walkPoints: Point[];  // GPS-collected points
  triggerBand: TriggerBand;
  lastModified: string; // ISO date string
}

// What gets stored in localStorage
type StoredData = Structure[];

// Export format
interface ExportData {
  // Standard format for compatibility
  geoJSON: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: { name: string; type: string; };
      geometry: { type: "Polygon"; coordinates: number[][][]; };
    }>;
  };
  
  // Custom format for our app
  customFormat: {
    structures: Array<{
      id: string;
      name: string;
      mapPoints: Point[];
      walkPoints: Point[];
      triggerBand: { points: Point[]; thickness: number; };
    }>;
    exportDate: string;
  };
}

// Map view state
interface MapViewState {
  center: Point;
  zoom: number;
}

// Editing modes for the map
type MapMode = 'view' | 'addMapPoints' | 'addWalkPoints' | 'editPoints' | 'triggerBand' | 'walking';

// Structure with computed properties (for rendering)
interface StructureWithComputed extends Structure {
  bounds?: L.LatLngBounds;
  area?: number;
}

export type { Point, TriggerBand, Structure, StoredData, ExportData, MapViewState, MapMode, StructureWithComputed };