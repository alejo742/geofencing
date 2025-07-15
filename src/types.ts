interface WindowEventMap {
  'layer-visibility-change': CustomEvent<{
    layer: string;
    visible: boolean;
  }>;
}

interface Point {
  lat: number;
  lng: number;
}

interface TriggerBand {
  points: Point[];
  thickness: number; // Width in meters
  calculatedPoints?: Point[]; // Generated points for the actual band area
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

// GeoJSON feature types
interface GeoJSONFeature {
  type: "Feature";
  properties: {
    structureId?: string;
    name?: string;
    type?: string;
    thickness?: number;
    lastModified?: string;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

// GeoJSON collection
interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Custom export format
interface CustomFormat {
  version: string;
  structures: Structure[];
  metadata: {
    exportedAt: string;
    appVersion: string;
  };
}

// Export format types
interface ExportData {
  // Standard format for compatibility
  geoJSON: GeoJSONCollection;
  
  // Custom format for our app
  customFormat: CustomFormat;
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

export type { 
  Point, 
  TriggerBand, 
  Structure, 
  StoredData, 
  GeoJSONFeature,
  GeoJSONCollection,
  CustomFormat,
  ExportData, 
  MapViewState, 
  MapMode, 
  StructureWithComputed 
};