'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '@/hooks/useApp';
import { pointToLeaflet, leafletToPoint } from '@/utils/mapUtils';
import { calculateTriggerBand } from '@/utils/geoUtils';
import { Structure, Point } from '@/types';

interface StructureLayerProps {
  map: L.Map | null;
}

export default function StructureLayer({ map }: StructureLayerProps) {
  const { 
    structures, 
    activeStructureId, 
    activeStructure,
    setActiveStructureId,
    mapMode,
    addPointToStructure,
    movePointInStructure,
    deletePointFromStructure,
    addPointToTriggerBand
  } = useApp();
  
  const structureLayerRef = useRef<L.LayerGroup | null>(null);
  const walkPointsLayerRef = useRef<L.LayerGroup | null>(null);
  const triggerBandLayerRef = useRef<L.LayerGroup | null>(null);
  const editMarkersRef = useRef<L.Marker[]>([]);
  
  // Setup map click handler for adding points
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!activeStructure) return;
      
      const clickedPoint: Point = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      
      if (mapMode === 'addMapPoints') {
        addPointToStructure(clickedPoint, 'map');
      } else if (mapMode === 'addWalkPoints') {
        addPointToStructure(clickedPoint, 'walk');
      } else if (mapMode === 'triggerBand') {
        addPointToTriggerBand(clickedPoint);
      }
    };
    
    if (mapMode === 'addMapPoints' || mapMode === 'addWalkPoints' || mapMode === 'triggerBand') {
      map.on('click', handleMapClick);
      
      // Change cursor to indicate clickable map
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    }
    
    return () => {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, mapMode, activeStructure, addPointToStructure, addPointToTriggerBand]);
  
  // Render structures and points
  useEffect(() => {
    if (!map) return;
    
    // Create layer groups if they don't exist
    if (!structureLayerRef.current) {
      structureLayerRef.current = L.layerGroup().addTo(map);
    } else {
      structureLayerRef.current.clearLayers();
    }
    
    if (!walkPointsLayerRef.current) {
      walkPointsLayerRef.current = L.layerGroup().addTo(map);
    } else {
      walkPointsLayerRef.current.clearLayers();
    }
    
    if (!triggerBandLayerRef.current) {
      triggerBandLayerRef.current = L.layerGroup().addTo(map);
    } else {
      triggerBandLayerRef.current.clearLayers();
    }
    
    // Clear any existing edit markers
    editMarkersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    editMarkersRef.current = [];
    
    // Add each structure to the map
    structures.forEach(structure => {
      const isActive = structure.id === activeStructureId;
      
      // Render map polygons
      if (structure.mapPoints.length >= 3) {
        const latLngs = structure.mapPoints.map(point => 
          [point.lat, point.lng] as L.LatLngExpression
        );
        
        const polygon = L.polygon(latLngs, {
          color: isActive ? '#4CAF50' : '#3388ff',
          weight: isActive ? 3 : 2,
          opacity: isActive ? 0.9 : 0.7,
          fillColor: isActive ? '#4CAF50' : '#3388ff',
          fillOpacity: isActive ? 0.3 : 0.2,
          className: 'structure-polygon' // Used for layer visibility
        });
        
        // Don't add click handlers in edit mode
        if (mapMode !== 'editPoints' && mapMode !== 'triggerBand') {
          polygon.on('click', () => {
            setActiveStructureId(structure.id);
          });
        }
        
        polygon.bindTooltip(structure.name, {
          permanent: false,
          direction: 'center',
          className: 'structure-label' // Used for label visibility
        });
        
        // Safely add to layer group
        if (structureLayerRef.current) {
          polygon.addTo(structureLayerRef.current);
        }
      }
      
      // Render individual map points as circles if fewer than 3 points
      if (structure.mapPoints.length > 0 && structure.mapPoints.length < 3) {
        structure.mapPoints.forEach((point, index) => {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 6,
            color: isActive ? '#4CAF50' : '#3388ff',
            weight: 2,
            fillColor: isActive ? '#4CAF50' : '#3388ff',
            fillOpacity: 0.5,
            className: 'structure-point' // Used for layer visibility
          });
          
          if (mapMode !== 'editPoints' && mapMode !== 'triggerBand') {
            marker.on('click', () => {
              setActiveStructureId(structure.id);
            });
          }
          
          marker.bindTooltip(`${structure.name} - Point ${index + 1}`, {
            className: 'structure-label' // Used for label visibility
          });
          
          // Safely add to layer group
          if (structureLayerRef.current) {
            marker.addTo(structureLayerRef.current);
          }
        });
      }
      
      // Add walk points visualization
      if (structure.walkPoints.length > 0) {
        structure.walkPoints.forEach((point, index) => {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 4,
            color: '#2196F3',
            weight: 2,
            fillColor: '#2196F3',
            fillOpacity: 0.5,
            className: 'walk-point' // Used for layer visibility
          });
          
          marker.bindTooltip(`Walk Point ${index + 1}`, {
            className: 'structure-label' // Used for label visibility
          });
          
          // Safely add to layer group
          if (walkPointsLayerRef.current) {
            marker.addTo(walkPointsLayerRef.current);
          }
        });
      }
      
      // Add trigger band visualization if it exists
      if (structure.triggerBand && structure.triggerBand.points.length > 0) {
        const bandPoints = structure.triggerBand.points;
        
        // Show trigger band points
        bandPoints.forEach((point, index) => {
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 4,
            color: '#9C27B0',
            weight: 2,
            fillColor: '#9C27B0',
            fillOpacity: 0.5,
            className: 'trigger-point' // Used for layer visibility
          });
          
          marker.bindTooltip(`Trigger Point ${index + 1}`, {
            className: 'structure-label' // Used for label visibility
          });
          
          if (triggerBandLayerRef.current) {
            marker.addTo(triggerBandLayerRef.current);
          }
        });
        
        // Draw line connecting trigger band points
        if (bandPoints.length >= 2) {
          const latLngs = bandPoints.map(point => 
            [point.lat, point.lng] as L.LatLngExpression
          );
          
          const polyline = L.polyline(latLngs, {
            color: '#9C27B0',
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 5',
            className: 'trigger-band-line' // Used for layer visibility
          });
          
          if (triggerBandLayerRef.current) {
            polyline.addTo(triggerBandLayerRef.current);
          }
          
          // Generate and draw the actual trigger band area
          if (isActive) {
            const thickness = structure.triggerBand.thickness || 5;
            const bandPolygon = calculateTriggerBand(bandPoints, thickness);
            
            if (bandPolygon.length >= 3) {
              const bandLatLngs = bandPolygon.map(point => 
                [point.lat, point.lng] as L.LatLngExpression
              );
              
              const band = L.polygon(bandLatLngs, {
                color: '#9C27B0',
                weight: 1,
                opacity: 0.5,
                fillColor: '#9C27B0',
                fillOpacity: 0.2,
                className: 'trigger-band' // Used for layer visibility
              });
              
              band.bindTooltip(`Trigger Band (${thickness}m)`, {
                className: 'structure-label' // Used for label visibility
              });
              
              if (triggerBandLayerRef.current) {
                band.addTo(triggerBandLayerRef.current);
              }
            }
          }
        }
      }
    });
    
    // Add editable markers in edit mode
    if (mapMode === 'editPoints' && activeStructure) {
      // Add draggable markers for map points
      activeStructure.mapPoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin bg-green-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">${index + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });
        
        // Add drag handler
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          movePointInStructure(index, { lat: newPos.lat, lng: newPos.lng }, 'map');
        });
        
        // Add click handler for deletion
        marker.on('click', () => {
          if (confirm(`Delete map point ${index + 1}?`)) {
            deletePointFromStructure(index, 'map');
          }
        });
        
        marker.addTo(map);
        editMarkersRef.current.push(marker);
      });
      
      // Add draggable markers for walk points
      activeStructure.walkPoints.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">W${index + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });
        
        // Add drag handler
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          movePointInStructure(index, { lat: newPos.lat, lng: newPos.lng }, 'walk');
        });
        
        // Add click handler for deletion
        marker.on('click', () => {
          if (confirm(`Delete walk point ${index + 1}?`)) {
            deletePointFromStructure(index, 'walk');
          }
        });
        
        marker.addTo(map);
        editMarkersRef.current.push(marker);
      });
    }
    
    // Add editable markers for trigger band in trigger band mode
    if (mapMode === 'triggerBand' && activeStructure && activeStructure.triggerBand) {
      activeStructure.triggerBand.points.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin bg-purple-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">T${index + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });
        
        // Add drag handler
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          // Update the trigger band point position
          const updatedStructure = {
            ...activeStructure,
            triggerBand: {
              ...activeStructure.triggerBand,
              points: activeStructure.triggerBand.points.map((p, i) => 
                i === index ? { lat: newPos.lat, lng: newPos.lng } : p
              )
            }
          };
          // Use the existing updateStructure function
          if (typeof window !== 'undefined') {
            // Access updateStructure from AppContext
            const appContext = (window as any).__APP_CONTEXT__;
            if (appContext && appContext.updateStructure) {
              appContext.updateStructure(updatedStructure);
            }
          }
        });
        
        // Add click handler for deletion
        marker.on('click', () => {
          if (confirm(`Delete trigger band point ${index + 1}?`)) {
            // Remove the trigger band point
            const updatedStructure = {
              ...activeStructure,
              triggerBand: {
                ...activeStructure.triggerBand,
                points: activeStructure.triggerBand.points.filter((_, i) => i !== index)
              }
            };
            // Use the existing updateStructure function
            if (typeof window !== 'undefined') {
              // Access updateStructure from AppContext
              const appContext = (window as any).__APP_CONTEXT__;
              if (appContext && appContext.updateStructure) {
                appContext.updateStructure(updatedStructure);
              }
            }
          }
        });
        
        marker.addTo(map);
        editMarkersRef.current.push(marker);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (structureLayerRef.current) {
        structureLayerRef.current.clearLayers();
      }
      
      if (walkPointsLayerRef.current) {
        walkPointsLayerRef.current.clearLayers();
      }
      
      if (triggerBandLayerRef.current) {
        triggerBandLayerRef.current.clearLayers();
      }
      
      editMarkersRef.current.forEach(marker => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      editMarkersRef.current = [];
    };
  }, [
    map, 
    structures, 
    activeStructureId, 
    activeStructure, 
    mapMode, 
    setActiveStructureId, 
    movePointInStructure, 
    deletePointFromStructure
  ]);
  
  return null; // This is a non-visual component that manipulates the map directly
}