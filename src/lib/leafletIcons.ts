// Only import Leaflet when in browser environment
let L: any = null;

// Initialize Leaflet only on client side
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

// Fix Leaflet's default icon path issues in webpack/Next.js environments
const fixLeafletIcons = () => {
  // Only run this on the client side
  if (typeof window === 'undefined' || !L) return;

  // Delete the default icon images since they won't work with webpack
  delete L.Icon.Default.prototype._getIconUrl;

  // Set icon paths manually using direct URLs
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Create custom icon factories for different point types
export const createMapPointIcon = () => {
  if (typeof window === 'undefined' || !L) return null;
  
  return new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export const createWalkPointIcon = () => {
  if (typeof window === 'undefined' || !L) return null;
  
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Run the fix when this module is imported, but only on client side
if (typeof window !== 'undefined') {
  fixLeafletIcons();
}

export default fixLeafletIcons;