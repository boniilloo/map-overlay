import React, { useState, useEffect } from 'react';
import { overlayService } from '../services/supabase';
import { OverlayData } from '../types';

interface EditMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: OverlayData | null;
  onMapUpdated: () => void;
}

const EditMapModal: React.FC<EditMapModalProps> = ({ isOpen, onClose, map, onMapUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    opacity: 0.7,
    scale: 1.0,
    rotation: 0,
    position: { lat: 0, lng: 0 },
    anchorPoints: null as any
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when map changes
  useEffect(() => {
    if (map) {
      // Check if we have updated anchor points from the map editing
      const updatedAnchorPoints = (window as any).currentAnchorPoints;
      

      
      setFormData({
        name: map.name,
        opacity: map.opacity,
        scale: map.scale,
        rotation: map.rotation,
        position: map.position,
        anchorPoints: updatedAnchorPoints || map.anchorPoints || null
      });
    }
  }, [map]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!map) {
      setError('No hay mapa seleccionado para editar.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {

      
      await overlayService.updateOverlay(map.id, {
        name: formData.name,
        opacity: formData.opacity,
        scale: formData.scale,
        rotation: formData.rotation,
        position: formData.position,
        anchorPoints: formData.anchorPoints
      });

      // Clear temporary anchor points after successful save
      (window as any).currentAnchorPoints = null;
      (window as any).currentCenterPosition = null;

      onMapUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating map:', err);
      setError(`Error al actualizar el mapa: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      // Clear temporary anchor points when closing without saving
      (window as any).currentAnchorPoints = null;
      (window as any).currentCenterPosition = null;
      onClose();
    }
  };

  if (!isOpen || !map) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Editar Mapa: {map.name}
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Ajusta las propiedades del mapa
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Nombre del mapa
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Opacity */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Opacidad: {Math.round(formData.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.opacity}
                onChange={(e) => setFormData({ ...formData, opacity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Scale */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Escala: {formData.scale.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={formData.scale}
                onChange={(e) => setFormData({ ...formData, scale: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Rotation */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Rotación: {formData.rotation}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={formData.rotation}
                onChange={(e) => setFormData({ ...formData, rotation: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Position */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Posición Central
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.position.lat}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: { ...formData.position, lat: parseFloat(e.target.value) }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.position.lng}
                    onChange={(e) => setFormData({
                      ...formData,
                      position: { ...formData.position, lng: parseFloat(e.target.value) }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Anchor Points Info */}
            {formData.anchorPoints && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Coordenadas de Esquinas (calculadas automáticamente)
                </label>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <div><strong>Esquina Superior Izquierda:</strong> {formData.anchorPoints.topLeft.lat.toFixed(6)}, {formData.anchorPoints.topLeft.lng.toFixed(6)}</div>
                  <div><strong>Esquina Superior Derecha:</strong> {formData.anchorPoints.topRight.lat.toFixed(6)}, {formData.anchorPoints.topRight.lng.toFixed(6)}</div>
                  <div><strong>Esquina Inferior Izquierda:</strong> {formData.anchorPoints.bottomLeft.lat.toFixed(6)}, {formData.anchorPoints.bottomLeft.lng.toFixed(6)}</div>
                  <div><strong>Esquina Inferior Derecha:</strong> {formData.anchorPoints.bottomRight.lat.toFixed(6)}, {formData.anchorPoints.bottomRight.lng.toFixed(6)}</div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3A5F76',
                  color: 'white',
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditMapModal; 