import React, { useState } from 'react';
import { OverlayData, OverlayControlState } from '../types';

interface OverlayControlsProps {
  overlay: OverlayData | null;
  onUpdate: (updates: Partial<OverlayData>) => void;
  onDelete: () => void;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const OverlayControls: React.FC<OverlayControlsProps> = ({
  overlay,
  onUpdate,
  onDelete,
  onClose,
  onFileUpload
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleOpacityChange = (value: number) => {
    if (overlay) {
      onUpdate({ opacity: value / 100 });
    }
  };

  const handleScaleChange = (value: number) => {
    if (overlay) {
      onUpdate({ scale: value / 100 });
    }
  };

  const handleRotationChange = (value: number) => {
    if (overlay) {
      onUpdate({ rotation: value });
    }
  };

  const handleNameChange = (name: string) => {
    if (overlay) {
      onUpdate({ name });
    }
  };

  if (!overlay) {
    return (
      <div className="overlay-controls">
        <h3>Map Overlay</h3>
        <div className="control-group">
          <label>Upload Image or PDF</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            placeholder="Select a file to overlay"
          />
        </div>
        <div className="control-group">
          <p style={{ fontSize: '14px', color: '#666' }}>
            Upload an image or PDF to overlay on the map. You can then adjust its position, scale, and opacity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-controls">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3>{overlay.name || 'Overlay'}</h3>
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#3A5F76'
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#666',
              marginLeft: '8px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="control-group">
            <label>Name</label>
            <input
              type="text"
              value={overlay.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div className="control-group">
            <label>Opacity: {Math.round(overlay.opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(overlay.opacity * 100)}
              onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Scale: {Math.round(overlay.scale * 100)}%</label>
            <input
              type="range"
              min="10"
              max="500"
              value={Math.round(overlay.scale * 100)}
              onChange={(e) => handleScaleChange(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Rotation: {Math.round(overlay.rotation)}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(overlay.rotation)}
              onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Position</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={overlay.position.lat.toFixed(6)}
                  onChange={(e) => onUpdate({
                    position: {
                      ...overlay.position,
                      lat: parseFloat(e.target.value) || 0
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={overlay.position.lng.toFixed(6)}
                  onChange={(e) => onUpdate({
                    position: {
                      ...overlay.position,
                      lng: parseFloat(e.target.value) || 0
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="control-group">
            <button
              onClick={onDelete}
              style={{
                backgroundColor: '#E74C3C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Delete Overlay
            </button>
          </div>
        </>
      )}

      {!isExpanded && (
        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Opacity: {Math.round(overlay.opacity * 100)}% | Scale: {Math.round(overlay.scale * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayControls; 