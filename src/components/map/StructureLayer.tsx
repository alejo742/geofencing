'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '@/hooks/useApp';
import { leafletToPoint } from '@/utils/mapUtils';
import { calculateTriggerBand } from '@/utils/geoUtils';
import { calculateTriggerBandBetweenPolygons } from '@/utils/geoUtils';
import { Structure, Point } from '@/types';
import { ActionTooltip } from '../ui/ActionTooltip';

interface StructureLayerProps {
  map: L.Map | null;
}

export default function StructureLayer({ map }: StructureLayerProps) {
  const { 
    structures, 
    activeStructureCode, 
    activeStructure,
    setActiveStructureCode,
    mapMode,
    addPointToStructure,
    movePointInStructure,
    deletePointFromStructure,
    addPointToTriggerBand,
    updateStructure
  } = useApp();
  
  const structureLayerRef = useRef<L.LayerGroup | null>(null);
  const walkPointsLayerRef = useRef<L.LayerGroup | null>(null);
  const triggerBandLayerRef = useRef<L.LayerGroup | null>(null);
  const pointMarkersRef = useRef<L.Marker[]>([]);
  const editMarkersRef = useRef<L.Marker[]>([]);

  const [confirmationState, setConfirmationState] = useState<{
    show: boolean;
    title: string;
    message: string;
    pointIndex: number;
    pointType: 'map' | 'walk' | 'trigger';
    position: { x: number, y: number } | null;
  }>({
    show: false,
    title: '',
    message: '',
    pointIndex: -1,
    pointType: 'map',
    position: null
  });
  
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
    
    // Clear any existing markers
    pointMarkersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    pointMarkersRef.current = [];
    
    // Clear any existing edit markers
    editMarkersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    editMarkersRef.current = [];
    
    // Add each structure to the map
    structures.forEach(structure => {
      const isActive = structure.code === activeStructureCode;
      
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
          className: 'structure-polygon', // Used for layer visibility
          interactive: mapMode === 'view',
          bubblingMouseEvents: true,
        });
        
        // Don't add click handlers in edit mode
        if (mapMode !== 'editPoints' && mapMode !== 'triggerBand') {
          polygon.on('click', () => {
            setActiveStructureCode(structure.code);
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
      
      // Show point numbers for active structure (not just in edit mode)
      if (isActive) {
        // Render map point numbers for active structure
        structure.mapPoints.forEach((point, index) => {
          // Only create visible markers if not in edit mode (edit mode has its own markers)
          if (mapMode !== 'editPoints') {
            const marker = L.marker([point.lat, point.lng], {
              icon: L.divIcon({
                className: 'point-number-marker map-point-marker',
                html: `<div class="w-8 h-8 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-white text-s font-bold">${index + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            });
            
            marker.bindTooltip(`Map Point ${index + 1}`, {
              className: 'point-label'
            });
            
            marker.addTo(map);
            pointMarkersRef.current.push(marker);
          }
        });
        
        // Render walk point numbers for active structure
        structure.walkPoints.forEach((point, index) => {
          // Only create visible markers if not in edit mode (edit mode has its own markers)
          if (mapMode !== 'editPoints') {
            const marker = L.marker([point.lat, point.lng], {
              icon: L.divIcon({
                className: 'point-number-marker walk-point-marker',
                html: `<div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">W${index + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            });
            
            marker.bindTooltip(`Walk Point ${index + 1}`, {
              className: 'point-label'
            });
            
            marker.addTo(map);
            pointMarkersRef.current.push(marker);
          }
        });
        
        // Render trigger band point numbers for active structure
        if (structure.triggerBand && structure.triggerBand.points.length > 0 && mapMode !== 'triggerBand') {
          structure.triggerBand.points.forEach((point, index) => {
            const marker = L.marker([point.lat, point.lng], {
              icon: L.divIcon({
                className: 'point-number-marker trigger-point-marker',
                html: `<div class="w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">T${index + 1}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            });
            
            marker.bindTooltip(`Trigger Point ${index + 1}`, {
              className: 'point-label'
            });
            
            marker.addTo(map);
            pointMarkersRef.current.push(marker);
          });
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
              setActiveStructureCode(structure.code);
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
      if (structure.walkPoints.length >= 3) {
        const latLngs = structure.walkPoints.map(point => 
          [point.lat, point.lng] as L.LatLngExpression
        );
        
        const polygon = L.polygon(latLngs, {
          color: '#2196F3',  // Blue
          weight: isActive ? 3 : 2,
          opacity: isActive ? 0.9 : 0.7,
          fillColor: '#2196F3',
          fillOpacity: 0.2,
          className: 'walk-polygon'
        });
        
        if (mapMode !== 'editPoints' && mapMode !== 'triggerBand') {
          polygon.on('click', () => {
            setActiveStructureCode(structure.code);
          });
        }
        
        polygon.bindTooltip(`${structure.name} - Inner Boundary`, {
          className: 'structure-label'
        });
        
        // Safely add to layer group
        if (walkPointsLayerRef.current) {
          polygon.addTo(walkPointsLayerRef.current);
        }
      }
      
      // visualize trigger band in case it exists
      if (structure.triggerBand && structure.triggerBand.points.length >= 3) {
        const bandPoints = structure.triggerBand.points;
        const latLngs = bandPoints.map(point => 
          [point.lat, point.lng] as L.LatLngExpression
        );
        
        // Draw the trigger band as a polyline (fence)
        const bandPolyline = L.polyline(latLngs, {
          color: '#9C27B0', // Purple
          weight: 3, // Fixed width for the fence
          opacity: 1,
          lineCap: 'butt',
          lineJoin: 'miter',
          dashArray: undefined, // Solid line
          className: 'trigger-band-fence'
        });
        
        bandPolyline.bindTooltip(`${structure.name} - Trigger Band (${structure.triggerBand.thickness}m)`, {
          className: 'trigger-band-label'
        });
        
        if (triggerBandLayerRef.current) {
          bandPolyline.addTo(triggerBandLayerRef.current);
        }
        
        // Draw the trigger band vertices as markers
        bandPoints.forEach((point, index) => {
          // Skip the last point if it's a duplicate of the first (for closing the polygon)
          if (index === bandPoints.length - 1 && 
              point.lat === bandPoints[0].lat && 
              point.lng === bandPoints[0].lng) {
            return;
          }
          
          const marker = L.circleMarker([point.lat, point.lng], {
            radius: 4,
            color: '#9C27B0',
            fillColor: '#9C27B0',
            fillOpacity: 1,
            weight: 1
          });
          
          if (triggerBandLayerRef.current) {
            marker.addTo(triggerBandLayerRef.current);
          }
        });
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
        marker.on('click', (e) => {
          showDeleteConfirmation(index, 'walk', e);
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
        marker.on('click', (e) => {
          showDeleteConfirmation(index, 'walk', e);
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
          updateStructure(updatedStructure);
        });
        
        // Add click handler for deletion
        marker.on('click', (e) => {
          showDeleteConfirmation(index, 'map', e);
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
      
      pointMarkersRef.current.forEach(marker => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      pointMarkersRef.current = [];
      
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
    activeStructureCode, 
    activeStructure, 
    mapMode, 
    setActiveStructureCode, 
    movePointInStructure, 
    deletePointFromStructure,
    updateStructure
  ]);

  useEffect(() => {
    if (activeStructure && 
        activeStructure.mapPoints.length >= 3 && 
        activeStructure.walkPoints.length >= 3 &&
        mapMode !== 'triggerBand') { // Don't auto-generate when in edit mode
            
      // Make sure the polygons have vertices in the same order
      // This ensures corresponding vertices are matched correctly
      const alignedWalkPoints = alignPolygonVertices(
        activeStructure.walkPoints,
        activeStructure.mapPoints
      );
      
      // Calculate trigger band between the two polygons
      const triggerPoints = calculateTriggerBandBetweenPolygons(
        activeStructure.mapPoints,
        alignedWalkPoints
      );
      
      // Only update if we got valid points and they're different from current ones
      if (triggerPoints.length >= 3 && 
          JSON.stringify(triggerPoints) !== JSON.stringify(activeStructure.triggerBand.points)) {
        
        console.log(`Generated ${triggerPoints.length} trigger band points`);
        
        // Update the trigger band
        const updatedStructure = {
          ...activeStructure,
          triggerBand: {
            ...activeStructure.triggerBand,
            points: triggerPoints
          },
          lastModified: new Date().toISOString()
        };
        
        updateStructure(updatedStructure);
      }
    }
  }, [activeStructure?.mapPoints, activeStructure?.walkPoints, activeStructure?.code, mapMode]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!map) return;
    
    const handleVisibilityChange = (event: CustomEvent<{layer: string, visible: boolean}>) => {
      const { layer, visible } = event.detail;
      
      // Handle visibility changes for different layers
      if (layer === 'mapPoints') {
        // Toggle the map polygon layer
        if (structureLayerRef.current) {
          if (visible) {
            structureLayerRef.current.addTo(map);
          } else {
            structureLayerRef.current.remove();
          }
        }
        
        // Toggle the map point markers
        pointMarkersRef.current.forEach(marker => {
          const markerElement = marker.getElement();
          if (markerElement && markerElement.classList.contains('map-point-marker')) {
            if (visible) {
              marker.addTo(map);
            } else {
              marker.remove();
            }
          }
        });
      }
      
      if (layer === 'walkPoints') {
        // Toggle the walk polygon layer
        if (walkPointsLayerRef.current) {
          if (visible) {
            walkPointsLayerRef.current.addTo(map);
          } else {
            walkPointsLayerRef.current.remove();
          }
        }
        
        // Toggle the walk point markers
        pointMarkersRef.current.forEach(marker => {
          const markerElement = marker.getElement();
          if (markerElement && markerElement.classList.contains('walk-point-marker')) {
            if (visible) {
              marker.addTo(map);
            } else {
              marker.remove();
            }
          }
        });
      }
      
      if (layer === 'triggerBand') {
        // Toggle the trigger band layer
        if (triggerBandLayerRef.current) {
          if (visible) {
            triggerBandLayerRef.current.addTo(map);
          } else {
            triggerBandLayerRef.current.remove();
          }
        }
        
        // Toggle the trigger band point markers
        pointMarkersRef.current.forEach(marker => {
          const markerElement = marker.getElement();
          if (markerElement && markerElement.classList.contains('trigger-point-marker')) {
            if (visible) {
              marker.addTo(map);
            } else {
              marker.remove();
            }
          }
        });
      }
    };
    
    // Add event listener
    window.addEventListener('layer-visibility-change', handleVisibilityChange as EventListener);
    
    return () => {
      // Remove event listener on cleanup
      window.removeEventListener('layer-visibility-change', handleVisibilityChange as EventListener);
    };
  }, [map]);
  
  /**
   * Align vertices of two polygons to match similar points
   * This ensures midpoints are calculated between corresponding vertices
   */
  function alignPolygonVertices(walkPoints: Point[], mapPoints: Point[]): Point[] {
    if (walkPoints.length < 3 || mapPoints.length < 3) return walkPoints;
    
    // Find centroid of both polygons
    const walkCentroid = getCentroid(walkPoints);
    const mapCentroid = getCentroid(mapPoints);
    
    // Sort walk points by angle from centroid
    // This helps align vertices based on their angular position
    const sortedWalkPoints = [...walkPoints].sort((a, b) => {
      const angleA = Math.atan2(a.lat - walkCentroid.lat, a.lng - walkCentroid.lng);
      const angleB = Math.atan2(b.lat - walkCentroid.lat, b.lng - walkCentroid.lng);
      return angleA - angleB;
    });
    
    return sortedWalkPoints;
  }
  
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

  const showDeleteConfirmation = (
    index: number, 
    type: 'map' | 'walk' | 'trigger', 
    event: L.LeafletMouseEvent
  ) => {
    // Get the click position for positioning the tooltip
    const clickPoint = event.containerPoint;
    
    setConfirmationState({
      show: true,
      title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)} Point`,
      message: `Are you sure you want to delete ${type} point ${index + 1}?`,
      pointIndex: index,
      pointType: type,
      position: { x: clickPoint.x, y: clickPoint.y }
    });
    
    // Prevent the click from propagating to the map
    L.DomEvent.stopPropagation(event);
  };
  
  // Handle actual deletion
  const handleDeleteConfirmed = () => {
    const { pointIndex, pointType } = confirmationState;
    
    if (pointType === 'map' || pointType === 'walk') {
      deletePointFromStructure(pointIndex, pointType);
    } else if (pointType === 'trigger' && activeStructure) {
      // Handle trigger point deletion
      const updatedStructure = {
        ...activeStructure,
        triggerBand: {
          ...activeStructure.triggerBand,
          points: activeStructure.triggerBand.points.filter((_, i) => i !== pointIndex)
        }
      };
      updateStructure(updatedStructure);
    }
    
    // Reset confirmation state
    setConfirmationState(prev => ({ ...prev, show: false }));
  };
  
  // Cancel function
  const handleDeleteCanceled = () => {
    setConfirmationState(prev => ({ ...prev, show: false }));
  };
  
  return (
    <>
      {confirmationState.show && confirmationState.position && (
        <div 
          className="absolute z-50 pointer-events-auto" 
          style={{ 
            left: `${confirmationState.position.x}px`, 
            top: `${confirmationState.position.y}px`
          }}
        >
          <ActionTooltip
            title={confirmationState.title}
            message={confirmationState.message}
            actionData={{
              acceptText: "Delete",
              cancelText: "Cancel",
              onAccept: handleDeleteConfirmed,
              onCancel: handleDeleteCanceled
            }}
          />
        </div>
      )}
    </>
  )
}