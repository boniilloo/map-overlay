export interface OverlayData {
  id: string;
  name: string;
  imageUrl: string;
  opacity: number;
  scale: number;
  rotation: number;
  position: {
    lat: number;
    lng: number;
  };
  anchorPoints?: {
    topLeft: { lat: number; lng: number };
    topRight: { lat: number; lng: number };
    bottomLeft: { lat: number; lng: number };
    bottomRight: { lat: number; lng: number };
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  preferences: {
    defaultMapType: 'osm' | 'satellite' | 'hybrid';
    defaultOpacity: number;
    autoSave: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface CompassData {
  heading: number;
  accuracy: number;
  timestamp: number;
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
  mapType: 'osm' | 'satellite' | 'hybrid';
}

export interface OverlayControlState {
  opacity: number;
  scale: number;
  rotation: number;
  isVisible: boolean;
  isLocked: boolean;
} 