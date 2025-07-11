# Evergreen Geofencing Tool – Simplified Implementation Spec

## Overview

This document outlines a streamlined implementation for a simple, short-term geofencing tool using Next.js (App Router) and TypeScript. This app will be used briefly (approximately one week) to collect geofence data for campus buildings.

## Project Structure (Next.js App Router)

```
geofencing/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main page component
│   │   ├── page.module.css         # Main page styles
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── styles/                 # CSS modules for components
│   │   ├── MapView.tsx             # Map component with all map functionality
│   │   ├── MapControls.tsx         # Zoom, center buttons
│   │   ├── PointActions.tsx        # UI for adding/editing points
│   │   ├── StructureList.tsx       # List of created structures
│   │   ├── NewStructureForm.tsx    # Form to create a structure
│   │   ├── WalkControls.tsx        # GPS walking mode controls
│   │   ├── TriggerBandAdjuster.tsx # Thickness slider and controls
│   │   ├── ExportButton.tsx        # Export functionality
│   │   └── ImportButton.tsx        # Import functionality
│   ├── lib/
│   │   ├── storage.ts              # localStorage functions
│   │   │   ├── saveStructures()    # Save to localStorage
│   │   │   └── loadStructures()    # Load from localStorage
│   │   ├── mapUtils.ts             # Map-related utilities
│   │   │   ├── initMap()           # Initialize the map
│   │   │   ├── addMapPoint()       # Add manual point to map
│   │   │   ├── addWalkPoint()      # Add GPS point to structure
│   │   │   ├── deletePoint()       # Remove a point
│   │   │   └── movePoint()         # Move a point
│   │   ├── geoUtils.ts             # Geospatial calculations
│   │   │   ├── getCurrentPosition()      # Get user's GPS position
│   │   │   ├── generateTriggerBand()     # Create band between polygons
│   │   │   ├── updateTriggerThickness()  # Adjust band thickness
│   │   │   └── pointsToPolygon()         # Convert points to polygon
│   │   └── exportUtils.ts          # Export/import functionality
│   │       ├── structuresToGeoJSON()     # Convert to GeoJSON
│   │       ├── structuresToCustomFormat() # Convert to custom format
│   │       ├── exportData()              # Create and download file
│   │       └── importData()              # Parse imported JSON
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── hooks/
│       ├── useLocalStorage.ts      # Hook for localStorage operations
│       └── useGeolocation.ts       # Hook for GPS functionality
├── package.json
├── next.config.js
└── tsconfig.json
```

## Core Functionality Only

Since this is a temporary tool, we'll focus exclusively on essential features:

1. Create/import geofence maps
2. Add points via manual clicking or GPS walking
3. Generate trigger bands between polygons
4. Export data in dual format (GeoJSON + custom)

## Data Model

```typescript
// All in types/index.ts
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
```

## Detailed Implementation Plan

### Phase 1: Basic Setup & Storage

1. **Next.js App Router Setup**
   - Create project with: `npx create-next-app@latest`
   - Set up `app/page.tsx` as main component
   - Add simple responsive layout in `app/layout.tsx`

2. **Simple Data Storage**
   - Implement `storage.ts` with localStorage functions
     - `saveStructures(structures: Structure[]): void`
     - `loadStructures(): Structure[]`
   - Create `useLocalStorage.ts` hook for React components to access storage
     - `useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]`

3. **Basic UI Structure**
   - Create simple header in `layout.tsx`
   - Implement `StructureList.tsx` for sidebar
     - Display list of structures
     - Select active structure
   - Add `NewStructureForm.tsx` with name input field

### Phase 2: Map & Drawing Implementation

1. **Map Integration**
   - Create `MapView.tsx` component using Mapbox or Leaflet
   - Implement `mapUtils.ts` functions:
     - `initMap(element: HTMLElement, center: Point, zoom: number): Map`
     - `centerMap(map: Map, position: Point): void`
   - Add `MapControls.tsx` with zoom/center buttons

2. **Polygon Creation**
   - In `MapView.tsx`, add click handler for adding map points
   - Implement in `mapUtils.ts`:
     - `addMapPoint(structure: Structure, point: Point): Structure`
     - `movePoint(structure: Structure, index: number, newPos: Point, type: 'map'|'walk'): Structure`
     - `deletePoint(structure: Structure, index: number, type: 'map'|'walk'): Structure`
   - Create `PointActions.tsx` with controls for point manipulation

3. **GPS Walking Mode**
   - Create `useGeolocation.ts` hook:
     - `useGeolocation(): { position: Point|null, error: string|null, accuracy: number|null }`
   - Implement `WalkControls.tsx`:
     - Toggle for GPS tracking
     - Button to add current position as walk point
   - Add to `geoUtils.ts`:
     - `getCurrentPosition(): Promise<{position: Point, accuracy: number}>`
     - `addWalkPoint(structure: Structure, point: Point): Structure`

### Phase 3: Core Functionality

1. **Dual Polygon Display**
   - Enhance `MapView.tsx` to render both polygons with different styles
   - Add polygon rendering utilities to `mapUtils.ts`:
     - `renderMapPoints(map: Map, points: Point[], color: string): void`
     - `renderWalkPoints(map: Map, points: Point[], color: string): void`

2. **Trigger Band Generation**
   - Implement in `geoUtils.ts`:
     - `generateTriggerBand(mapPoints: Point[], walkPoints: Point[], thickness: number): Point[]`
     - `updateTriggerThickness(structure: Structure, thickness: number): Structure`
   - Create `TriggerBandAdjuster.tsx` with thickness slider
   - Add auto-generation of trigger band when both polygons have enough points

3. **Dual Format Export**
   - Create `exportUtils.ts` with:
     - `structuresToGeoJSON(structures: Structure[]): GeoJSON`
     - `structuresToCustomFormat(structures: Structure[]): CustomFormat`
     - `exportData(structures: Structure[]): void` (generates file download)
   - Implement `ImportButton.tsx` and `ExportButton.tsx` components
   - Add to `exportUtils.ts`:
     - `importData(jsonString: string): Structure[]`

## User Flow

1. **Starting a Structure**
   - Click "New Structure" and enter name
   - App creates empty structure and makes it active

2. **Adding Points (Both Methods Work Simultaneously)**
   - **Manual Mode**: Click directly on map to add points
   - **GPS Mode**: Toggle "GPS Mode", walk to a spot, click "Add Walk Point"

3. **Editing Points**
   - Drag any point to reposition
   - Click a point to select/delete it

4. **Generating & Adjusting Trigger Band**
   - Once both polygons have points, trigger band appears automatically
   - Adjust thickness using simple slider

5. **Saving & Exporting**
   - Work is saved to localStorage automatically every 30 seconds
   - Click "Export" to download complete data file

## Implementation Notes

1. **Keep It Simple**
   - Use React's built-in `useState` and `useEffect` hooks
   - Minimal error handling - focus on the happy path
   - Use basic TypeScript interfaces without complex type features

2. **Performance Considerations**
   - Small dataset means we don't need complex optimization
   - Direct DOM manipulation for map is acceptable
   - No server-side rendering needed - make it a client component

3. **Styling**
   - Use simple CSS or minimal Tailwind
   - Focus on mobile-friendly controls for field use

## Development Timeline

A developer should complete this in 2-3 days:
- Day 1: Project setup, map integration, basic point adding
- Day 2: GPS functionality, trigger band calculation
- Day 3: Export functionality, testing, polish

Remember: This tool will only be used for approximately one week, so focus solely on functionality that directly supports the core geofencing data collection task. Skip any "nice-to-have" features.