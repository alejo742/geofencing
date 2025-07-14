import { Point, Structure } from '@/types';

/**
 * Calculate perpendicular vector with given length
 */
function perpendicularVector(p1: Point, p2: Point, length: number): Point {
  // Calculate direction vector
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  
  // Calculate length of direction vector
  const dirLength = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize and rotate 90 degrees to get perpendicular vector
  // Rotation matrix for 90 degrees: [0, -1; 1, 0]
  const perpX = -dy * length / dirLength;
  const perpY = dx * length / dirLength;
  
  return { lat: perpY, lng: perpX };
}

/**
 * Calculate offset points for a polyline to create a trigger band
 */
export function calculateTriggerBand(points: Point[], thickness: number): Point[] {
  if (points.length < 2) return [];
  
  // Convert meters to approximate degrees (very rough approximation)
  // At equator, 1 degree is about 111,000 meters
  // We divide by 2 because the thickness is the total width, not radius
  const offsetDegrees = thickness / 111000 / 2;
  
  const result: Point[] = [];
  
  // Calculate left side of the band
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const perp = perpendicularVector(p1, p2, offsetDegrees);
    
    // Add point on the left side
    if (i === 0) {
      result.push({ 
        lat: p1.lat + perp.lat, 
        lng: p1.lng + perp.lng 
      });
    }
    
    result.push({ 
      lat: p2.lat + perp.lat, 
      lng: p2.lng + perp.lng 
    });
  }
  
  // Calculate right side of the band (in reverse)
  for (let i = points.length - 1; i > 0; i--) {
    const p1 = points[i];
    const p2 = points[i - 1];
    const perp = perpendicularVector(p1, p2, offsetDegrees);
    
    // Add point on the right side
    result.push({ 
      lat: p1.lat - perp.lat, 
      lng: p1.lng - perp.lng 
    });
  }
  
  // Close the polygon
  if (points.length >= 2) {
    const p1 = points[0];
    const p2 = points[1];
    const perp = perpendicularVector(p1, p2, offsetDegrees);
    
    result.push({ 
      lat: p1.lat - perp.lat, 
      lng: p1.lng - perp.lng 
    });
  }
  
  return result;
}

/**
 * Calculate trigger band as a polygon with corners at the midpoints
 * between corresponding corners of the map and walk polygons
 */
export function calculateTriggerBandBetweenPolygons(
  mapPoints: Point[], 
  walkPoints: Point[]
): Point[] {
  if (mapPoints.length < 3 || walkPoints.length < 3) {
    return [];
  }
  
  // Ensure we have the same number of points to work with
  // by using the smaller of the two arrays
  const numPoints = Math.min(mapPoints.length, walkPoints.length);
  
  // First, ensure both polygons have vertices in the same order
  // by sorting them by angle from their respective centroids
  const mapCentroid = getCentroid(mapPoints);
  const walkCentroid = getCentroid(walkPoints);
  
  const sortedMapPoints = [...mapPoints].sort((a, b) => {
    const angleA = Math.atan2(a.lat - mapCentroid.lat, a.lng - mapCentroid.lng);
    const angleB = Math.atan2(b.lat - mapCentroid.lat, b.lng - mapCentroid.lng);
    return angleA - angleB;
  });
  
  const sortedWalkPoints = [...walkPoints].sort((a, b) => {
    const angleA = Math.atan2(a.lat - walkCentroid.lat, a.lng - walkCentroid.lng);
    const angleB = Math.atan2(b.lat - walkCentroid.lat, b.lng - walkCentroid.lng);
    return angleA - angleB;
  });
  
  // Now create the trigger points at the midpoints between corresponding vertices
  const triggerPoints: Point[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const mapVertex = sortedMapPoints[i % sortedMapPoints.length];
    const walkVertex = sortedWalkPoints[i % sortedWalkPoints.length];
    
    // Calculate the exact midpoint between these two vertices
    const midpoint: Point = {
      lat: (mapVertex.lat + walkVertex.lat) / 2,
      lng: (mapVertex.lng + walkVertex.lng) / 2
    };
    
    triggerPoints.push(midpoint);
  }
  
  // Ensure the polygon is closed by adding the first point at the end if needed
  if (triggerPoints.length > 0 && 
      (triggerPoints[0].lat !== triggerPoints[triggerPoints.length - 1].lat || 
       triggerPoints[0].lng !== triggerPoints[triggerPoints.length - 1].lng)) {
    triggerPoints.push({...triggerPoints[0]});
  }
  
  return triggerPoints;
}

// Helper function to calculate polygon centroid
function getCentroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ 
    lat: acc.lat + p.lat, 
    lng: acc.lng + p.lng 
  }), { lat: 0, lng: 0 });
  
  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
}

/**
 * Determine if a point is within a trigger band by checking
 * if it's inside the trigger band polygon
 */
export function isPointInTriggerBand(
  point: Point,
  triggerBandPoints: Point[]
): boolean {
  if (triggerBandPoints.length < 3) return false;
  
  // Check if point is inside the polygon formed by triggerBandPoints
  return isPointInPolygon(point, triggerBandPoints);
}

/**
 * Check if a point is inside a polygon
 * Uses the ray casting algorithm
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
/**
 * Update the trigger band thickness in a structure
 */
export function updateTriggerThickness(structure: Structure, thickness: number): Structure {
  // Update the thickness
  const updatedStructure = {
    ...structure,
    triggerBand: {
      ...structure.triggerBand,
      thickness,
      lastModified: new Date().toISOString()
    }
  };
  
  // If we have enough points, regenerate the trigger band
  if (structure.triggerBand.points.length >= 2) {
    const triggerPoints = calculateTriggerBand(
      structure.triggerBand.points,
      thickness
    );
    
    if (triggerPoints.length >= 3) {
      return {
        ...updatedStructure,
        triggerBand: {
          ...updatedStructure.triggerBand,
          calculatedPoints: triggerPoints
        }
      };
    }
  }
  
  return updatedStructure;
}