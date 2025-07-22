import { useState, useEffect, useCallback } from 'react';
import { Point } from '@/types';

interface GeolocationState {
  position: Point | null;
  error: string | null;
  accuracy: number | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<Point | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = (pos: GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    });
    setAccuracy(pos.coords.accuracy);
    setError(null);
  };

  const handleError = (err: GeolocationPositionError) => {
    let errorMessage = 'Unknown geolocation error';
    
    if (err.code === 1) {
      errorMessage = 'Permission denied';
    } else if (err.code === 2) {
      errorMessage = 'Position unavailable';
    } else if (err.code === 3) {
      errorMessage = 'Timeout';
    }
    
    setError(errorMessage);
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 500,
      maximumAge: 0
    });
    
    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 500,
        maximumAge: 0
      }
    );
    
    setWatchId(id);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    position,
    error,
    accuracy,
    isTracking,
    startTracking,
    stopTracking
  };
}