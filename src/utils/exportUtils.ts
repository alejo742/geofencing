import { Structure, Point } from '@/types';


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
        structureId: structure.id,
        code: structure.code ?? undefined,           // Export code
        name: structure.name,
        description: structure.description ?? undefined, // Export description
        type: boundaryType,
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
    version: '1.1',
    structures,
    metadata: {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
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
 * Import data from JSON string
 */
export function importData(jsonString: string): Structure[] {
  try {
    console.log("Parsing JSON...");
    const parsed = JSON.parse(jsonString);
    console.log("Parsed JSON:", parsed);

    // Check if it's our custom format
    if (parsed.version && Array.isArray(parsed.structures)) {
      console.log("Detected custom format");
      return parsed.structures;
    }

    // Check if it's our metadata wrapper
    if (parsed.metadata && Array.isArray(parsed.customFormat?.structures)) {
      console.log("Detected metadata wrapper format");
      return parsed.customFormat.structures;
    }

    // Check if it's GeoJSON
    if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      console.log("Detected GeoJSON format");
      // Group features by structureId
      const structuresMap = new Map<string, Partial<Structure>>();

      parsed.features.forEach((feature: GeoJSONFeature) => {
        const { structureId, code, name, description, type, thickness } = feature.properties;

        const id = structureId || crypto.randomUUID();

        // Initialize structure if it doesn't exist
        if (!structuresMap.has(id)) {
          structuresMap.set(id, {
            id,
            code: code || undefined,
            name: name || 'Imported Structure',
            description: description || undefined,
            mapPoints: [],
            walkPoints: [],
            triggerBand: {
              points: [],
              thickness: 5
            },
            lastModified: new Date().toISOString()
          });
        }

        const structure = structuresMap.get(id)!;

        // Handle different feature types
        if (type === 'mapPoints' && feature.geometry.type === 'Polygon') {
          // Extract map points from the first ring of the polygon
          const points: Point[] = feature.geometry.coordinates[0]
            .slice(0, -1) // Remove the last point (closing point)
            .map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

          structure.mapPoints = points;
        }
        else if (type === 'walkPoints' && feature.geometry.type === 'LineString') {
          // Extract walk points from the line string
          const points: Point[] = feature.geometry.coordinates.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }));

          structure.walkPoints = points;
        }
        else if (type === 'triggerBand' && feature.geometry.type === 'Polygon') {
          // Extract trigger band points from the first ring of the polygon
          const points: Point[] = feature.geometry.coordinates[0]
            .slice(0, -1) // Remove the last point (closing point)
            .map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }));

          if (structure.triggerBand) {
            structure.triggerBand.points = points;
            if (thickness) {
              structure.triggerBand.thickness = thickness;
            }
          }
        }
      });

      // Convert map to array and ensure all properties are present
      return Array.from(structuresMap.values()).map(partial => {
        return {
          id: partial.id || crypto.randomUUID(),
          code: partial.code || undefined,
          name: partial.name || 'Imported Structure',
          description: partial.description || undefined,
          mapPoints: partial.mapPoints || [],
          walkPoints: partial.walkPoints || [],
          triggerBand: partial.triggerBand || {
            points: [],
            thickness: 5
          },
          lastModified: partial.lastModified || new Date().toISOString()
        };
      });
    }

    // Check if it's a simple array of structures
    if (Array.isArray(parsed)) {
      console.log("Detected array format");
      // Validate that each item has the required structure properties
      return parsed.filter(item =>
        item && typeof item === 'object' &&
        (item.mapPoints || item.walkPoints)
      ).map(item => ({
        id: item.id || crypto.randomUUID(),
        code: item.code || undefined,
        name: item.name || 'Imported Structure',
        description: item.description || undefined,
        mapPoints: Array.isArray(item.mapPoints) ? item.mapPoints : [],
        walkPoints: Array.isArray(item.walkPoints) ? item.walkPoints : [],
        triggerBand: item.triggerBand || {
          points: [],
          thickness: 5
        },
        lastModified: item.lastModified || new Date().toISOString()
      }));
    }

    // If we got here, try to extract a structure directly
    if (parsed && typeof parsed === 'object' && (parsed.mapPoints || parsed.walkPoints)) {
      console.log("Detected single structure format");
      return [{
        id: parsed.id || crypto.randomUUID(),
        code: parsed.code || undefined,
        name: parsed.name || 'Imported Structure',
        description: parsed.description || undefined,
        mapPoints: Array.isArray(parsed.mapPoints) ? parsed.mapPoints : [],
        walkPoints: Array.isArray(parsed.walkPoints) ? parsed.walkPoints : [],
        triggerBand: parsed.triggerBand || {
          points: [],
          thickness: 5
        },
        lastModified: parsed.lastModified || new Date().toISOString()
      }];
    }

    throw new Error('Unsupported format');
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error; // Re-throw so the caller can handle it
  }
}