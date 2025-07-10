# Evergreen Geofencing Tool

A simple web application for defining, refining, and exporting geofence boundaries for Dartmouth campus locations. This tool allows users to combine map-drawn boundaries with real-world GPS walking points to create more accurate geofences.

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/alejo742/geofencing.git
cd geofencing

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

### Browser Compatibility

For best results, use this tool on a mobile device with GPS capabilities. The app works in most modern browsers, but we recommend:
- Chrome/Safari on iOS
- Chrome on Android

## Using the Geofencing Tool

### 1. Creating a New Structure

1. Click the "New Structure" button in the sidebar
2. Enter the name of the building or area (e.g., "Baker Library")
3. Click "Create" to start defining the structure

### 2. Drawing Boundaries

The app allows you to define boundaries in two ways simultaneously:

#### Map Drawing (Manual)
- Click directly on the map to place points
- Points will connect automatically to form a polygon
- Drag any point to reposition it
- Click a point to select/delete it

#### GPS Walking (Physical)
- Walk to a corner or boundary point of the building
- Enable "GPS Mode" using the toggle
- Click "Add Walk Point" to drop a point at your current location
- Repeat for each corner of the building
- The app shows your current GPS accuracy

### 3. Adjusting the Trigger Band

Once you have both map-drawn and GPS-walked points:

1. A "trigger band" is automatically generated between the two boundaries
2. Use the thickness slider to adjust how wide this band should be
3. The trigger band represents the area where location-based events will fire

### 4. Saving and Exporting

- All work is automatically saved to your browser's local storage
- Click "Export" to download the complete geofence data as a JSON file
- You can also import previously exported JSON files

## Understanding the Exported Data

The exported JSON file contains a dual-format structure:

```json
{
  "geoJSON": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "customFormat": {
    "structures": [...],
    "exportDate": "2025-07-09T17:49:54Z"
  }
}
```

### GeoJSON Format

The `geoJSON` portion follows the standard GeoJSON format for compatibility with mapping libraries and GIS tools. For each structure, it includes:

1. A feature for the map-drawn polygon (`type: "map"`)
2. A feature for the GPS-walked polygon (`type: "walk"`)
3. A feature for the trigger band (`type: "trigger"`)

### Custom Format

The `customFormat` portion contains our application-specific data structure that preserves:

- Both the map-drawn and GPS-walked points separately
- The trigger band with its thickness value
- Additional metadata about each structure

Example structure in custom format:

```json
{
  "id": "b4d8e-f7c2-...",
  "name": "Baker Library",
  "mapPoints": [
    {"lat": 43.7056, "lng": -72.2943},
    {"lat": 43.7057, "lng": -72.2939},
    ...
  ],
  "walkPoints": [
    {"lat": 43.7055, "lng": -72.2944},
    {"lat": 43.7058, "lng": -72.2938},
    ...
  ],
  "triggerBand": {
    "points": [...],
    "thickness": 5
  },
  "lastModified": "2025-07-09T16:30:22Z"
}
```

## Using the Data in Your Applications

### For Geofencing in Mobile/Web Apps

The trigger band polygon is designed to serve as your actual geofence boundary:

1. Extract the trigger band coordinates from either format
2. Use these coordinates with a geofencing library in your application
3. The thickness value represents how precise the boundary is

Example implementation in a JavaScript application:

```javascript
// Using the GeoJSON format
const triggerFeature = exportedData.geoJSON.features.find(
  f => f.properties.type === "trigger" && f.properties.name === "Baker Library"
);
const coordinates = triggerFeature.geometry.coordinates[0];

// Or using the custom format
const structure = exportedData.customFormat.structures.find(
  s => s.name === "Baker Library"
);
const triggerPoints = structure.triggerBand.points;

// Use with a geofencing library
myGeofenceLib.create({
  id: "baker-library",
  polygon: coordinates, // or convert triggerPoints to required format
  events: {
    onEnter: () => console.log("Entered Baker Library zone"),
    onExit: () => console.log("Exited Baker Library zone")
  }
});
```

### For Visualization

The GeoJSON format can be directly used with mapping libraries:

```javascript
// Example with Mapbox GL
map.addSource('geofences', {
  type: 'geojson',
  data: exportedData.geoJSON
});

map.addLayer({
  id: 'trigger-zones',
  type: 'fill',
  source: 'geofences',
  filter: ['==', ['get', 'type'], 'trigger'],
  paint: {
    'fill-color': '#FF9500',
    'fill-opacity': 0.3,
    'fill-outline-color': '#FF7B00'
  }
});
```

## Troubleshooting

### GPS Issues
- For best results, use the app outdoors or near windows
- Stand still for a few seconds before adding walk points
- Wait for GPS accuracy to improve before collecting points

### Data Management
- If you need to start over, use the "Clear All Data" option
- Export your work frequently as a backup
- Each team member can create their own export file, and these can be combined later

## About Next.js

This project uses [Next.js](https://nextjs.org) with the App Router. For more information about Next.js, check out:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)