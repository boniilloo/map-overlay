import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { GPSLocation, CompassData } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [compass, setCompass] = useState<CompassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    checkDeviceSupport();
  }, []);

  const checkDeviceSupport = async () => {
    try {
      const info = await Device.getInfo();
      const isWebPlatform = info.platform === 'web';
      setIsWeb(isWebPlatform);
      setIsSupported(isWebPlatform || 'geolocation' in navigator);
    } catch (err) {
      console.error('Error checking device support:', err);
      setIsWeb(true);
      setIsSupported('geolocation' in navigator);
    }
  };

  // Web-based geolocation
  const getWebLocation = (): Promise<GPSLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!position) {
            reject(new Error('Position is null'));
            return;
          }

          const locationData: GPSLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };
          resolve(locationData);
        },
        (error) => {
          console.warn('Geolocation error:', error.code, error.message);
          
          // Handle specific error codes
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              reject(new Error('Location permission denied. Please allow location access.'));
              break;
            case 2: // POSITION_UNAVAILABLE
              reject(new Error('Location information unavailable. Please check your GPS settings.'));
              break;
            case 3: // TIMEOUT
              reject(new Error('Location request timed out. Please try again.'));
              break;
            default:
              reject(new Error(`Geolocation error: ${error.message}`));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // Increased from 10s to 30s
          maximumAge: 3000 // Update every 3 seconds
        }
      );
    });
  };

  const watchWebLocation = (callback: (location: GPSLocation) => void) => {
    if (!navigator.geolocation) {
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!position) {
          console.error('Position is null');
          return;
        }

        const locationData: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        
        if (position.coords.heading !== null) {
          setCompass({
            heading: position.coords.heading,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        }

        callback(locationData);
      },
      (error) => {
        console.warn('Web geolocation error:', error.code, error.message);
        
        // Handle specific error codes
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            setError('Location permission denied. Please allow location access.');
            break;
          case 2: // POSITION_UNAVAILABLE
            setError('Location information unavailable. Please check your GPS settings.');
            break;
          case 3: // TIMEOUT
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError(`Geolocation error: ${error.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased from 10s to 30s
        maximumAge: 3000 // Update every 3 seconds
      }
    );

    return watchId.toString();
  };

  // Capacitor-based geolocation (for mobile)
  const getCapacitorLocation = async (): Promise<GPSLocation> => {
    const permission = await Geolocation.checkPermissions();
    
    if (permission.location === 'granted') {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };
    } else if (permission.location === 'prompt') {
      const request = await Geolocation.requestPermissions();
      if (request.location === 'granted') {
        return getCapacitorLocation();
      } else {
        throw new Error('Location permission denied');
      }
    } else {
      throw new Error('Location permission denied');
    }
  };

  const watchCapacitorLocation = async (callback?: (location: GPSLocation) => void) => {
    const permission = await Geolocation.checkPermissions();
    
    if (permission.location !== 'granted') {
      if (permission.location === 'prompt') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          setError('Location permission denied');
          return;
        }
      } else {
        setError('Location permission denied');
        return;
      }
    }

    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      },
      (position) => {
        if (!position) {
          console.error('Position is null');
          return;
        }

        const locationData: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        
        if (position.coords.heading !== null) {
          setCompass({
            heading: position.coords.heading,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        }

        if (callback) {
          callback(locationData);
        }
      }
    );

    return watchId;
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (isWeb) {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }
        
        // For web, we'll try to get location and see if it works
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (position) {
              resolve(true);
            } else {
              resolve(false);
            }
          },
          (error) => {
            console.warn('Permission check error:', error.code, error.message);
            // Don't reject on timeout, just return false
            if (error.code === 3) { // TIMEOUT
              resolve(false);
            } else {
              resolve(false);
            }
          },
          { 
            timeout: 15000, // Increased timeout for permission check
            maximumAge: 3000, // Update every 3 seconds
            enableHighAccuracy: false // Use low accuracy for permission check
          }
        );
      });
    } else {
      try {
        const permission = await Geolocation.checkPermissions();
        
        if (permission.location === 'granted') {
          return true;
        }

        if (permission.location === 'prompt') {
          const request = await Geolocation.requestPermissions();
          return request.location === 'granted';
        }

        return false;
      } catch (err) {
        console.error('Error requesting permissions:', err);
        return false;
      }
    }
  };

  const getCurrentLocation = useCallback(async (retryCount = 0): Promise<GPSLocation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermissions();
      
      if (!hasPermission) {
        setError('Location permission denied');
        setIsLoading(false);
        return null;
      }

      const locationData = isWeb 
        ? await getWebLocation()
        : await getCapacitorLocation();

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (err) {
      console.error('Error getting location:', err);
      
      // Retry on timeout (max 2 retries)
      if (err instanceof Error && err.message.includes('timed out') && retryCount < 2) {
        setIsLoading(false);
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return getCurrentLocation(retryCount + 1);
      }
      
      setError('Failed to get location');
      setIsLoading(false);
      return null;
    }
  }, [isWeb, requestPermissions, getWebLocation, getCapacitorLocation]);

  const startWatchingLocation = useCallback(async (callback?: (location: GPSLocation) => void) => {
    try {
      const hasPermission = await requestPermissions();
      
      if (!hasPermission) {
        setError('Location permission denied');
        return;
      }

      const watchId = isWeb 
        ? watchWebLocation(callback || (() => {}))
        : await watchCapacitorLocation(callback);

      return watchId;
    } catch (err) {
      console.error('Error watching location:', err);
      setError('Failed to start location tracking');
    }
  }, [isWeb, requestPermissions, watchWebLocation, watchCapacitorLocation]);

  const stopWatchingLocation = async (watchId: string) => {
    try {
      if (isWeb) {
        navigator.geolocation.clearWatch(parseInt(watchId));
      } else {
        await Geolocation.clearWatch({ id: watchId });
      }
    } catch (err) {
      console.error('Error stopping location watch:', err);
    }
  };

  // Web-based compass support (for development/testing)
  const startCompass = useCallback(() => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          setCompass({
            heading: event.alpha,
            accuracy: 5, // Approximate accuracy for device orientation
            timestamp: Date.now()
          });
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  return {
    location,
    compass,
    isLoading,
    error,
    isSupported,
    isWeb,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    startCompass,
    requestPermissions
  };
}; 