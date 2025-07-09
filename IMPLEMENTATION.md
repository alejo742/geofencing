# Evergreen Geofencing Tool – Simplified Implementation Spec

## Overview

This document outlines a streamlined implementation for a simple, short-term geofencing tool using Next.js and TypeScript. This app will be used briefly (approximately one week) to collect geofence data for campus buildings.

## Core Functionality Only

Since this is a temporary tool, we'll focus exclusively on essential features:

1. Create/import geofence maps
2. Add points via manual clicking or GPS walking
3. Generate trigger bands between polygons
4. Export data in dual format (GeoJSON + custom)

## Simplified Implementation Plan

### Phase 1: Basic Setup & Storage

1. **Next.js Project Setup**
   - Create minimal Next.js + TypeScript project
   - Single page application with basic styling

2. **Simple Data Storage**
   - Use localStorage as the only data store
   - Store all maps as a single stringified JSON array
   - Functions:
     - `saveToLocalStorage()`: Save current maps
     - `loadFromLocalStorage()`: Load saved maps

3. **Basic UI**
   - Simple header with app title
   - Main content area with map
   - Bottom toolbar with core actions
   - Side panel for structure list

### Phase 2: Map & Drawing Implementation

1. **Map Integration**
   - Add Mapbox or Leaflet map centered on Dartmouth
   - Implement basic zoom/pan controls
   - Functions:
     - `initMap()`: Setup map instance

2. **Simplified Polygon Creation**
   - Add "Start New Structure" button
   - Implement click-to-add-point on map
   - Display points and connecting lines
   - Allow point dragging and deletion
   - Functions:
     - `addPointOnClick()`: Add point when map is clicked
     - `deletePoint()`: Remove a point
     - `movePoint()`: Reposition a point

3. **GPS Walking Mode**
   - Add toggle button for "GPS mode"
   - When active, show current position
   - "Add Walk Point" button to capture GPS location
   - Functions:
     - `getCurrentPosition()`: Get user location
     - `addWalkPoint()`: Add GPS point to polygon

### Phase 3: Core Functionality

1. **Dual Polygon Display**
   - Show both manually-added and GPS-walked points on map
   - Use different colors to distinguish them
   - Functions:
     - `renderPolygons()`: Display both sets of points

2. **Simple Trigger Band Generation**
   - Calculate middle area between polygons
   - Add thickness slider
   - Functions:
     - `generateTriggerBand()`: Create band between polygons
     - `updateThickness()`: Adjust band width

3. **Dual Format Export**
   - Export button to download JSON file
   - Include both GeoJSON and custom format
   - Functions:
     - `exportData()`: Generate and download data file

## Project Structure

```
evergreen-geofencing-tool/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Map with drawing tools
│   │   ├── StructureList.tsx    # List of created structures
│   │   ├── ToolBar.tsx          # Bottom action buttons
│   │   └── ThicknessControl.tsx # Simple slider
│   ├── utils/
│   │   ├── storage.ts           # localStorage functions
│   │   ├── geoUtils.ts          # Geo calculations
│   │   └── exportUtils.ts       # Export formatting
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces
│   ├── pages/
│   │   └── index.tsx            # Main (only) page
│   └── styles/
│       └── globals.css          # Basic styling
├── package.json
└── tsconfig.json
```

## Data Model

```typescript
interface Point {
  lat: number;
  lng: number;
}

interface Structure {
  id: string;                // UUID
  name: string;              // Building name
  mapPoints: Point[];        // Manually clicked points
  walkPoints: Point[];       // GPS-collected points
  triggerBand: {
    points: Point[];         // Generated trigger area
    thickness: number;       // Width in meters
  };
  lastModified: string;      // ISO date string
}

// What gets stored in localStorage
type StoredData = Structure[];
```

## Export Format (Dual)

```typescript
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

## User Flow (Simplified)

1. **Starting a Structure**
   - Click "New Structure" and enter name
   - App creates empty structure and makes it active

2. **Adding Points (Both Methods Work Simultaneously)**
   - **Manual Mode**: Click directly on map to add points
   - **GPS Mode**: Toggle "GPS Mode", walk to a spot, click "Add Walk Point"

3. **Editing Points**
   - Drag any point to reposition
   - Click a point to select it

4. **Generating & Adjusting Trigger Band**
   - Once both polygons have points, trigger band appears automatically
   - Adjust thickness using simple slider

5. **Saving & Exporting**
   - Work is saved to localStorage automatically every small interval
   - Click "Export" to download complete data file

## Implementation Notes

1. **Keep It Simple**
   - No complex state management library - use React's useState
   - Minimal validation and error handling
   - Focus on core functionality only

2. **Performance Considerations**
   - No need for virtualization or optimized rendering
   - Simple direct DOM operations are fine
   - Avoid premature optimization

3. **Styling**
   - Basic, functional styling is sufficient
   - Use simple CSS but responsive

## Development Timeline

A developer should complete this in 2-3 days:
- Day 1: Project setup, map integration, basic point adding
- Day 2: GPS functionality, trigger band calculation
- Day 3: Export functionality, testing, polish

Remember: This tool will only be used for approximately one week, so focus solely on functionality that directly supports the core geofencing data collection task. Skip any "nice-to-have" features.