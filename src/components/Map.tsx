import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSLocation } from '../types';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapProps {
  currentLocation: GPSLocation | null;
}

// Component to handle map center updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

// Component to center map on current location
const CenterLocationButton: React.FC<{ currentLocation: GPSLocation | null }> = ({ currentLocation }) => {
  const map = useMap();

  const handleCenterLocation = () => {
    if (currentLocation) {
      map.setView([currentLocation.latitude, currentLocation.longitude], map.getZoom());
    }
  };

  if (!currentLocation) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: '#3A5F76',
        color: 'white',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '2px solid white',
        transition: 'all 0.2s ease'
      }}
      onClick={handleCenterLocation}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.backgroundColor = '#2C4A5F';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = '#3A5F76';
      }}
      title="Centrar en mi ubicación"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    </div>
  );
};

// Component for current location marker that updates properly
const CurrentLocationMarker: React.FC<{ currentLocation: GPSLocation | null }> = ({ currentLocation }) => {
  const map = useMap();

  // Remove debug logs to avoid console spam
  // useEffect(() => {
  //   if (currentLocation) {
  //     console.log('Current location updated in marker component:', currentLocation);
  //   }
  // }, [currentLocation]);

  if (!currentLocation) return null;

  // Create a simple, reliable custom icon using SVG
  const customIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="18" fill="#E74C3C" stroke="white" stroke-width="4" filter="url(#shadow)"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
        <circle cx="20" cy="20" r="4" fill="#E74C3C"/>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  return (
    <Marker
      position={[currentLocation.latitude, currentLocation.longitude]}
      icon={customIcon}
      zIndexOffset={1000}
    />
  );
};

const Map: React.FC<MapProps> = ({ currentLocation }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid default
  const [zoom] = useState(13);

  // Update map center when location changes
  useEffect(() => {
    if (currentLocation) {
      // Remove debug logs to avoid console spam
      // console.log('Current location updated:', currentLocation);
      // Don't auto-center the map, only update the marker position
      // setMapCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* OpenStreetMap base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
                {/* Current location marker */}
        <CurrentLocationMarker currentLocation={currentLocation} />
        
        {/* Map updater component */}
        <MapUpdater center={mapCenter} />
        
        {/* Center location button */}
        <CenterLocationButton currentLocation={currentLocation} />
      </MapContainer>
    </div>
  );
};

export default Map; 