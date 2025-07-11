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
 * Check if a point is within the trigger band
 */
export function isPointInTriggerBand(
  point: Point, 
  bandPoints: Point[], 
  thickness: number
): boolean {
  if (bandPoints.length < 2) return false;
  
  // Generate the full trigger band polygon
  const bandPolygon = calculateTriggerBand(bandPoints, thickness);
  
  // Use point-in-polygon algorithm
  return isPointInPolygon(point, bandPolygon);
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect = (
      (polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)
    ) && (
      point.lng < (polygon[j].lng - polygon[i].lng) * 
      (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + 
      polygon[i].lng
    );
    
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}