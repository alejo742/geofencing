import { Structure, Point } from '@/types';

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
 * Convert structures to GeoJSON format
 */
export function structuresToGeoJSON(structures: Structure[]): GeoJSONCollection {
  const features: GeoJSONFeature[] = [];
  
  structures.forEach(structure => {
    // Add the structure boundary (map points)
    if (structure.mapPoints.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            ...structure.mapPoints.map(p => [p.lng, p.lat]),
            [structure.mapPoints[0].lng, structure.mapPoints[0].lat] // Close the polygon
          ]]
        },
        properties: {
          structureId: structure.id,
          name: structure.name,
          type: 'mapPoints',
          lastModified: structure.lastModified
        }
      });
    }
    
    // Add the walk path
    if (structure.walkPoints.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: structure.walkPoints.map(p => [p.lng, p.lat])
        },
        properties: {
          structureId: structure.id,
          name: structure.name,
          type: 'walkPoints',
          lastModified: structure.lastModified
        }
      });
    }
    
    // Add the trigger band
    if (structure.triggerBand?.points.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            ...structure.triggerBand.points.map(p => [p.lng, p.lat]),
            [structure.triggerBand.points[0].lng, structure.triggerBand.points[0].lat] // Close the polygon
          ]]
        },
        properties: {
          structureId: structure.id,
          name: structure.name,
          type: 'triggerBand',
          thickness: structure.triggerBand.thickness,
          lastModified: structure.lastModified
        }
      });
    }
  });
  
  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Convert structures to our custom format
 */
export function structuresToCustomFormat(structures: Structure[]): CustomFormat {
  return {
    version: '1.0',
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
export function exportData(structures: Structure[], format: 'geojson' | 'custom' = 'custom'): void {
  try {
    let data: string;
    let filename: string;
    
    if (format === 'geojson') {
      data = JSON.stringify(structuresToGeoJSON(structures), null, 2);
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
        const { structureId, name, type, thickness } = feature.properties;
        
        const id = structureId || crypto.randomUUID();
        
        // Initialize structure if it doesn't exist
        if (!structuresMap.has(id)) {
          structuresMap.set(id, {
            id,
            name: name || 'Imported Structure',
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
          name: partial.name || 'Imported Structure',
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
        name: item.name || 'Imported Structure',
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
        name: parsed.name || 'Imported Structure',
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