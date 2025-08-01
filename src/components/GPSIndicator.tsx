import React from 'react';
import { GPSLocation } from '../types';

interface GPSIndicatorProps {
  location: GPSLocation | null;
  isLoading: boolean;
  error: string | null;
  onRequestLocation: () => void;
}

const GPSIndicator: React.FC<GPSIndicatorProps> = ({
  location,
  isLoading,
  error,
  onRequestLocation
}) => {
  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  const formatAccuracy = (accuracy: number): string => {
    if (accuracy < 1) {
      return `${Math.round(accuracy * 100)}cm`;
    } else if (accuracy < 1000) {
      return `${Math.round(accuracy)}m`;
    } else {
      return `${(accuracy / 1000).toFixed(1)}km`;
    }
  };

  const getStatusColor = (): string => {
    if (error) return '#E74C3C';
    if (isLoading) return '#F39C12';
    if (location) return '#27AE60';
    return '#95A5A6';
  };

  const getStatusText = (): string => {
    if (error) return 'GPS Error';
    if (isLoading) return 'Getting location...';
    if (location) return 'GPS Active';
    return 'GPS Off';
  };

  if (isLoading) {
    return (
      <div className="gps-indicator">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="loading" style={{ width: '16px', height: '16px' }}></div>
          <span>Getting location...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gps-indicator">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#E74C3C' }}>⚠️</span>
          <span>{error}</span>
          <button
            onClick={onRequestLocation}
            style={{
              background: 'none',
              border: '1px solid #E74C3C',
              color: '#E74C3C',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="gps-indicator">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#95A5A6' }}>📍</span>
          <span>GPS not available</span>
          <button
            onClick={onRequestLocation}
            style={{
              background: 'none',
              border: '1px solid #FFFFFF',
              color: '#FFFFFF',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Enable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gps-indicator">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor()
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: '500' }}>
            {getStatusText()}
          </span>
        </div>

        {/* Coordinates */}
        <div style={{ fontSize: '11px', lineHeight: '1.2' }}>
          <div>Lat: {formatCoordinate(location.latitude)}</div>
          <div>Lng: {formatCoordinate(location.longitude)}</div>
          <div>Acc: {formatAccuracy(location.accuracy)}</div>
        </div>

        {/* Speed (if available) */}
        {location.speed !== undefined && (
          <div style={{ fontSize: '11px' }}>
            Speed: {(location.speed * 3.6).toFixed(1)} km/h
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSIndicator; 