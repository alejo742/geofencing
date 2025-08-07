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

// Structure types enum - stored as lowercase
type StructureType = 'academic' | 'residential' | 'dining' | 'wellness' | 'commercial' | 'outdoor' | 'administrative' | 'transportation';

interface Structure {
  id: string;                 // UUID
  code: string;               // Unique code/identifier (now required)
  name: string;               // Building name
  description: string;        // Description (now required)
  type: StructureType;        // Structure type (new required field)
  mapPoints: Point[];         // Manually clicked points
  walkPoints: Point[];        // GPS-collected points
  triggerBand: TriggerBand;
  lastModified: string;       // ISO date string
}

// What gets stored in localStorage
type StoredData = Structure[];

// GeoJSON feature types
interface GeoJSONFeature {
  type: "Feature";
  properties: {
    structureId?: string;
    code?: string;            // Unique code/identifier (new)
    name?: string;
    description?: string;     // Description (new)
    type?: string;            // Structure type (new)
    boundaryType?: string;    // Boundary type (mapPoints, walkPoints, triggerBand)
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
  geoJSON: GeoJSONCollection;
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

// Utility functions for structure types
const STRUCTURE_TYPES: StructureType[] = [
  'academic',
  'residential', 
  'dining',
  'wellness',
  'commercial',
  'outdoor',
  'administrative',
  'transportation'
];

function capitalizeStructureType(type?: StructureType): string {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export type {
  Point,
  TriggerBand,
  Structure,
  StructureType,
  StoredData,
  GeoJSONFeature,
  GeoJSONCollection,
  CustomFormat,
  ExportData,
  MapViewState,
  MapMode,
  StructureWithComputed
};

export { STRUCTURE_TYPES, capitalizeStructureType };

type BoundaryType = 'mapPoints' | 'walkPoints' | 'triggerBand';