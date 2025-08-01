import React from 'react';
import { CompassData } from '../types';

interface CompassIndicatorProps {
  compass: CompassData | null;
  isLoading: boolean;
}

const CompassIndicator: React.FC<CompassIndicatorProps> = ({ compass, isLoading }) => {
  const getCompassDirection = (heading: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  const getCompassRotation = (heading: number): number => {
    return -heading; // Negative because CSS rotation is clockwise
  };

  if (isLoading) {
    return (
      <div className="compass-indicator">
        <div className="loading"></div>
      </div>
    );
  }

  if (!compass) {
    return (
      <div className="compass-indicator" style={{ backgroundColor: '#666' }}>
        ?
      </div>
    );
  }

  return (
    <div className="compass-indicator">
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Compass arrow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '2px',
            height: '20px',
            backgroundColor: '#FFFFFF',
            transform: `translate(-50%, -50%) rotate(${getCompassRotation(compass.heading)}deg)`,
            transformOrigin: 'center bottom',
            borderRadius: '1px'
          }}
        />
        
        {/* North indicator */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            fontWeight: 'bold',
            color: '#FFFFFF'
          }}
        >
          N
        </div>
        
        {/* Direction text */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            fontWeight: 'bold',
            color: '#FFFFFF'
          }}
        >
          {getCompassDirection(compass.heading)}
        </div>
      </div>
      
      {/* Heading degrees (small) */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '2px 4px',
          borderRadius: '3px'
        }}
      >
        {Math.round(compass.heading)}°
      </div>
    </div>
  );
};

export default CompassIndicator; 