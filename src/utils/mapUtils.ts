import type L from 'leaflet'; // Type import only
import { Point, Structure } from '@/types';

// Type guard function to check if we're in browser
const isBrowser = () => typeof window !== 'undefined';

// Get Leaflet instance safely
const getLeaflet = (): typeof L => {
  if (!isBrowser()) {
    throw new Error('Leaflet can only be used in browser environment');
  }
  return require('leaflet');
};

/**
 * Initialize a Leaflet map on the specified HTML element
 */
export function initMap(
  element: HTMLElement,
  center: Point = { lat: 43.7044, lng: -72.2887 },
  zoom: number = 16
): L.Map {
  const L = getLeaflet();
  
  const map = L.map(element).setView([center.lat, center.lng], zoom);
  
  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
  
  return map;
}

/**
 * Center map on specified position
 */
export function centerMap(map: L.Map, position: Point, zoom?: number): void {
  map.setView([position.lat, position.lng], zoom || map.getZoom());
}

/**
 * Convert Leaflet LatLng to our Point interface
 */
export function leafletToPoint(latLng: L.LatLng): Point {
  return { lat: latLng.lat, lng: latLng.lng };
}

/**
 * Convert our Point to Leaflet LatLng
 */
export function pointToLeaflet(point: Point): L.LatLng {
  const L = getLeaflet();
  return new L.LatLng(point.lat, point.lng);
}

/**
 * Calculate bounds for a structure's points
 */
export function getStructureBounds(structure: Structure): L.LatLngBounds | null {
  if (!structure.mapPoints.length) {
    return null;
  }
  
  const L = getLeaflet();
  
  const latLngs = structure.mapPoints.map(point => 
    new L.LatLng(point.lat, point.lng)
  );
  
  return L.latLngBounds(latLngs);
}

/**
 * Add a map point to a structure
 */
export function addMapPoint(structure: Structure, point: Point): Structure {
  return {
    ...structure,
    mapPoints: [...structure.mapPoints, point],
    lastModified: new Date().toISOString()
  };
}

/**
 * Move a point in a structure
 */
export function movePoint(
  structure: Structure, 
  index: number, 
  newPos: Point, 
  type: 'map' | 'walk'
): Structure {
  const pointsArray = type === 'map' ? 'mapPoints' : 'walkPoints';
  
  // Create a new array with the updated point
  const updatedPoints = [...structure[pointsArray]];
  updatedPoints[index] = newPos;
  
  return {
    ...structure,
    [pointsArray]: updatedPoints,
    lastModified: new Date().toISOString()
  };
}

/**
 * Delete a point from a structure
 */
export function deletePoint(
  structure: Structure, 
  index: number, 
  type: 'map' | 'walk'
): Structure {
  const pointsArray = type === 'map' ? 'mapPoints' : 'walkPoints';
  
  // Create a new array without the deleted point
  const updatedPoints = structure[pointsArray].filter((_, i) => i !== index);
  
  return {
    ...structure,
    [pointsArray]: updatedPoints,
    lastModified: new Date().toISOString()
  };
}

// Other utility functions remain the same - they don't use Leaflet directly
export function calculateAreaInSquareMeters(points: Point[]): number {
  if (points.length < 3) {
    return 0;
  }
  
  // Convert to x,y coordinates for calculation
  const earthRadiusM = 6371000;
  const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  
  // Convert lat/lng to x,y using equirectangular approximation
  const xy = points.map(p => {
    const x = p.lng * Math.cos(centerLat * Math.PI / 180) * earthRadiusM * Math.PI / 180;
    const y = p.lat * earthRadiusM * Math.PI / 180;
    return { x, y };
  });
  
  // Apply Shoelace formula
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y;
    area -= xy[j].x * xy[i].y;
  }
  
  return Math.abs(area) / 2;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }
  
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