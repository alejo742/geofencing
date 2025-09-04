/**
 * Geofencing Types and Interfaces
 */

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
type StructureType = 'academic' | 'residential' | 'dining' | 'wellness' | 'commercial' | 'outdoor' | 'administrative' | 'transportation' | 'social';

interface Structure {
  code: string;               // Unique code/identifier (primary key)
  name: string;               // Building name
  description: string;        // Description (now required)
  type: StructureType;        // Structure type (new required field)
  parentId?: string;          // Optional parent structure code for hierarchy
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
    code?: string;            // Unique code/identifier (primary key)
    name?: string;
    description?: string;     // Description
    type?: string;            // Structure type
    parentId?: string;        // Parent structure code for hierarchy
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

// Hierarchy helper types
interface StructureHierarchy {
  structure: Structure;
  children: StructureHierarchy[];
  depth: number;
}

interface StructureRelationship {
  parent: Structure | null;
  children: Structure[];
  siblings: Structure[];
  ancestors: Structure[];
  descendants: Structure[];
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
  'transportation',
  'social'
];

/**
 * Triggers Types and Interfaces
 */

interface NotificationConfig {
  title: string;
  body: string;
}

// Base trigger interface
interface BaseTrigger {
  id: string; // Unique identifier for the trigger
  type: 'membership' | 'permanence'; // Type of trigger
  structureCode: string; // Structure this trigger belongs to
  notificationConfig: NotificationConfig;
  flowId: string; // Flow identifier for the Dialogflow CX that should be triggered
  isActive: boolean; // Whether the trigger is active
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Membership trigger (enter/exit)
interface MembershipTrigger extends BaseTrigger {
  type: 'membership';
  triggerType: 'enter' | 'exit'; // When to trigger
}

// Permanence trigger (time-based)
interface PermanenceTrigger extends BaseTrigger {
  type: 'permanence';
  permanenceHours: number; // Hours required to trigger
}

// Union type for all triggers
type GeofencingTrigger = MembershipTrigger | PermanenceTrigger;

// Stored triggers format
interface TriggersExport {
  version: string;
  triggers: GeofencingTrigger[];
  metadata: {
    exportedAt: string;
    totalTriggers: number;
  };
}

export type {
  // Basic Types
  Point,
  TriggerBand,
  Structure,
  StructureType,

  // Data Formats
  StoredData,
  GeoJSONFeature,
  GeoJSONCollection,
  CustomFormat,
  ExportData,

  // Map Types
  MapViewState,
  MapMode,

  // Structure Hierarchy Types
  StructureWithComputed,
  StructureHierarchy,
  StructureRelationship,

  // Trigger Types
  NotificationConfig,
  BaseTrigger,
  MembershipTrigger,
  PermanenceTrigger,
  GeofencingTrigger,
  TriggersExport
};

export { 
  STRUCTURE_TYPES
};