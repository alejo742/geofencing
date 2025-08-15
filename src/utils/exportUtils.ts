import { Structure, Point, StructureType } from '@/types';

// Utility function to generate unique codes when collisions occur
function generateUniqueCode(baseCode: string, existingCodes: Set<string>): string {
  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }
  
  let counter = 2;
  let newCode = `${baseCode}${counter}`;
  
  while (existingCodes.has(newCode)) {
    counter++;
    newCode = `${baseCode}${counter}`;
  }
  
  return newCode;
}

// Utility function to extract structure data from any format, handling backwards compatibility
function extractStructureFromData(data: any, existingCodes: Set<string>): Structure {
  // Handle backwards compatibility - extract code from various possible sources
  let code = data.code || data.structureId || data.id || 'UNKNOWN';
  
  // Ensure code is a string and clean it up
  code = String(code).trim().toUpperCase();
  if (!code || code === 'UNKNOWN') {
    code = `STRUCT_${Date.now()}`;
  }
  
  // Generate unique code if collision
  const uniqueCode = generateUniqueCode(code, existingCodes);
  existingCodes.add(uniqueCode);
  
  return {
    code: uniqueCode,
    name: data.name || 'Imported Structure',
    description: data.description || '',
    type: (data.type as StructureType) || 'academic',
    parentId: data.parentId || undefined,
    mapPoints: Array.isArray(data.mapPoints) ? data.mapPoints : [],
    walkPoints: Array.isArray(data.walkPoints) ? data.walkPoints : [],
    triggerBand: data.triggerBand || {
      points: [],
      thickness: 5
    },
    lastModified: data.lastModified || new Date().toISOString()
  };
}


type BoundaryType = 'mapPoints' | 'walkPoints' | 'triggerBand';

// GeoJSON types
interface GeoJSONFeature {
  type: 'Feature';
  geometry: any;
  properties: any;
}

interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Custom format for our application
interface CustomFormat {
  version: string;
  structures: Structure[];
  metadata: {
    exportedAt: string;
    appVersion: string;
  };
}

/**
 * Convert structures to GeoJSON format using the selected boundary type.
 * For 'walkPoints' exports, it will create a LineString unless you set forcePolygon to true,
 * which will close the line and export as a Polygon (not usually recommended).
 */
export function structuresToGeoJSON(
  structures: Structure[],
  options?: {
    boundaryType?: BoundaryType;
    forcePolygon?: boolean; // if true, 'walkPoints' exports as a closed polygon
  }
): GeoJSONCollection {
  const boundaryType = options?.boundaryType || 'mapPoints';
  const forcePolygon = options?.forcePolygon || false;

  const features: GeoJSONFeature[] = [];

  structures.forEach(structure => {
    let points: Point[] = [];
    let geometryType = 'Polygon';
    let extraProps: any = {};

    if (boundaryType === 'mapPoints' && structure.mapPoints.length >= 3) {
      points = structure.mapPoints;
      geometryType = 'Polygon';
    } else if (boundaryType === 'walkPoints' && structure.walkPoints.length >= 2) {
      points = structure.walkPoints;
      geometryType = forcePolygon ? 'Polygon' : 'LineString';
    } else if (
      boundaryType === 'triggerBand' &&
      structure.triggerBand?.points.length >= 3
    ) {
      points = structure.triggerBand.points;
      geometryType = 'Polygon';
      extraProps.thickness = structure.triggerBand.thickness;
    } else {
      // Skip if selected boundary doesn't have enough points
      return;
    }

    let coordinates;
    if (geometryType === 'Polygon') {
      // For polygons, make sure the ring is closed
      coordinates = [[
        ...points.map(p => [p.lng, p.lat]),
        [points[0].lng, points[0].lat]
      ]];
    } else if (geometryType === 'LineString') {
      coordinates = points.map(p => [p.lng, p.lat]);
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: geometryType,
        coordinates
      },
      properties: {
        code: structure.code,           // Primary identifier
        name: structure.name,
        description: structure.description,
        type: structure.type,
        parentId: structure.parentId,   // Export parent relationship
        boundaryType: boundaryType,     // Export boundary type
        lastModified: structure.lastModified,
        ...extraProps
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Convert structures to our custom format including all boundaries and new fields.
 */
export function structuresToCustomFormat(structures: Structure[]): CustomFormat {
  return {
    version: '2.0', // Updated version to reflect hierarchy support
    structures,
    metadata: {
      exportedAt: new Date().toISOString(),
      appVersion: '2.0.0'
    }
  };
}

/**
 * Export data as a file download
 */
export function exportData(
  structures: Structure[],
  format: 'geojson' | 'custom' = 'custom',
  geojsonOptions?: { boundaryType?: BoundaryType; forcePolygon?: boolean }
): void {
  try {
    let data: string;
    let filename: string;

    if (format === 'geojson') {
      data = JSON.stringify(structuresToGeoJSON(structures, geojsonOptions), null, 2);
      filename = 'structures.geojson';
    } else {
      data = JSON.stringify(structuresToCustomFormat(structures), null, 2);
      filename = 'structures.json';
    }

    // Create blob and download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
  }
}

/**
 * Import data from JSON string with full backwards compatibility
 */
export function importData(jsonString: string): Structure[] {
  try {
    console.log("Parsing JSON...");
    const parsed = JSON.parse(jsonString);
    console.log("Parsed JSON:", parsed);

    const existingCodes = new Set<string>();

    // Check if it's our custom format
    if (parsed.version && Array.isArray(parsed.structures)) {
      console.log("Detected custom format");
      return parsed.structures.map((data: any) => extractStructureFromData(data, existingCodes));
    }

    // Check if it's our metadata wrapper
    if (parsed.metadata && Array.isArray(parsed.customFormat?.structures)) {
      console.log("Detected metadata wrapper format");
      return parsed.customFormat.structures.map((data: any) => extractStructureFromData(data, existingCodes));
    }

    // Check if it's GeoJSON
    if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      console.log("Detected GeoJSON format");
      // Group features by code (or fallback identifiers)
      const structuresMap = new Map<string, Partial<Structure>>();

      parsed.features.forEach((feature: GeoJSONFeature) => {
        const props = feature.properties;
        const code = props.code || props.structureId || props.id || `STRUCT_${Date.now()}`;

        // Initialize structure if it doesn't exist
        if (!structuresMap.has(code)) {
          structuresMap.set(code, {
            code,
            name: props.name || 'Imported Structure',
            description: props.description || '',
            type: (props.type as StructureType) || 'academic',
            parentId: props.parentId || undefined,
            mapPoints: [],
            walkPoints: [],
            triggerBand: {
              points: [],
              thickness: 5
            },
            lastModified: props.lastModified || new Date().toISOString()
          });
        }

        const structure = structuresMap.get(code)!;

        // Handle different boundary types
        if (props.boundaryType === 'mapPoints' && feature.geometry.type === 'Polygon') {
          const points: Point[] = feature.geometry.coordinates[0]
            .slice(0, -1) // Remove the last point (closing point)
            .map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

          structure.mapPoints = points;
        }
        else if (props.boundaryType === 'walkPoints' && feature.geometry.type === 'LineString') {
          const points: Point[] = feature.geometry.coordinates.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }));

          structure.walkPoints = points;
        }
        else if (props.boundaryType === 'triggerBand' && feature.geometry.type === 'Polygon') {
          const points: Point[] = feature.geometry.coordinates[0]
            .slice(0, -1) // Remove the last point (closing point)
            .map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

          if (structure.triggerBand) {
            structure.triggerBand.points = points;
            if (props.thickness) {
              structure.triggerBand.thickness = props.thickness;
            }
          }
        }
      });

      // Convert map to array and ensure all properties are present
      return Array.from(structuresMap.values()).map(partial => 
        extractStructureFromData(partial, existingCodes)
      );
    }

    // Check if it's a simple array of structures
    if (Array.isArray(parsed)) {
      console.log("Detected array format");
      return parsed
        .filter(item => item && typeof item === 'object' && (item.mapPoints || item.walkPoints))
        .map(data => extractStructureFromData(data, existingCodes));
    }

    // If we got here, try to extract a structure directly
    if (parsed && typeof parsed === 'object' && (parsed.mapPoints || parsed.walkPoints)) {
      console.log("Detected single structure format");
      return [extractStructureFromData(parsed, existingCodes)];
    }

    throw new Error('Unsupported format');
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error; // Re-throw so the caller can handle it
  }
}