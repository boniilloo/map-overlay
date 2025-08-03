import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSLocation, OverlayData } from '../types';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapProps {
  currentLocation: GPSLocation | null;
  selectedMap: OverlayData | null;
  isEditMode: boolean;
  onEditComplete: (bounds: L.LatLngBounds) => void;
  onOpacityChange?: (opacity: number) => void;
  onRotationChange?: (rotation: number) => void;
  onReferencePointsClick?: () => void;
  onMapReady?: (map: L.Map) => void;
}

// Component to handle map center updates
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    // Ensure map is ready before updating view
    if (map && map.getContainer()) {
      try {
        map.setView(center, map.getZoom());
      } catch (error) {
        console.error('Error updating map view:', error);
      }
    }
  }, [center, map]);

  return null;
};

// Component to capture map reference
const MapReferenceCapture: React.FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

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

// Component for handling image overlay with proper error handling
const ImageOverlayComponent: React.FC<{ overlay: OverlayData; isEditMode: boolean; onEditComplete: (bounds: L.LatLngBounds) => void }> = ({ overlay, isEditMode, onEditComplete }) => {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const cornerMarkersRef = useRef<L.Marker[]>([]);
  const anchorPointMarkersRef = useRef<L.Marker[]>([]);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const [imageError, setImageError] = useState(false);
  

  


  // Function to calculate center position from anchor points
  const calculateCenterFromAnchorPoints = (anchorPoints: any) => {
    return {
      lat: (anchorPoints.topLeft.lat + anchorPoints.bottomRight.lat) / 2,
      lng: (anchorPoints.topLeft.lng + anchorPoints.bottomRight.lng) / 2
    };
  };

  // Expose function to get current bounds and anchor points
  const getCurrentBounds = () => {
    if (cornerMarkersRef.current.length > 0) {
      const positions = cornerMarkersRef.current.map(m => m.getLatLng());
      const minLat = Math.min(...positions.map(p => p.lat));
      const maxLat = Math.max(...positions.map(p => p.lat));
      const minLng = Math.min(...positions.map(p => p.lng));
      const maxLng = Math.max(...positions.map(p => p.lng));
      
      const bounds = L.latLngBounds(
        [minLat, minLng],
        [maxLat, maxLng]
      );
      
      // Calculate anchor points in the correct format for rectangular shape
      const anchorPoints = {
        topLeft: { lat: maxLat, lng: minLng },
        topRight: { lat: maxLat, lng: maxLng },
        bottomLeft: { lat: minLat, lng: minLng },
        bottomRight: { lat: minLat, lng: maxLng }
      };
      
      // Calculate center position from anchor points
      const centerPosition = calculateCenterFromAnchorPoints(anchorPoints);
      

      
      return { bounds, anchorPoints, centerPosition };
    }
    return null;
  };

  // Expose getCurrentBounds globally for the confirm button
  (window as any).getCurrentOverlayBounds = getCurrentBounds;

  // useEffect para manejar interacciones del mapa en modo de edición
  useEffect(() => {
    if (isEditMode) {
      // Habilitar todas las interacciones del mapa en modo de edición
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    }

    return () => {
      // Restaurar interacciones al desmontar
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    };
  }, [isEditMode, map]);

  // useEffect para actualizar el marcador central cuando cambie el zoom o la vista del mapa
  useEffect(() => {
    if (!isEditMode || !centerMarkerRef.current) return;

    const updateCenterMarker = () => {
      if (centerMarkerRef.current) {
        // Si overlayRef está disponible, actualizar posición y tamaño
        if (overlayRef.current) {
          const currentBounds = overlayRef.current.getBounds();
          const newImageCenterLat = (currentBounds.getSouthWest().lat + currentBounds.getNorthEast().lat) / 2;
          const newImageCenterLng = (currentBounds.getSouthWest().lng + currentBounds.getNorthEast().lng) / 2;
          centerMarkerRef.current.setLatLng([newImageCenterLat, newImageCenterLng]);
          
          // Update center marker icon size to match new image size
          const imageElement = overlayRef.current.getElement();
          if (imageElement) {
            const rect = imageElement.getBoundingClientRect();
            const newIcon = L.divIcon({
              className: 'center-drag-marker',
              html: `<div style="
                width: ${rect.width}px;
                height: ${rect.height}px;
                background: transparent;
                border: 2px dashed #3A5F76;
                border-radius: 8px;
                cursor: move;
                opacity: 0.3;
                pointer-events: auto;
              "></div>`,
              iconSize: [rect.width, rect.height],
              iconAnchor: [rect.width / 2, rect.height / 2]
            });
            centerMarkerRef.current.setIcon(newIcon);
          }
        } else {
          // Si overlayRef no está disponible, solo actualizar el tamaño del icono basado en el zoom
          const currentZoom = map.getZoom();
          const baseSize = 100; // Tamaño base
          const zoomFactor = Math.pow(1.5, currentZoom - 10); // Factor de zoom
          const newSize = Math.max(50, Math.min(300, baseSize * zoomFactor)); // Limitar tamaño
          
          const newIcon = L.divIcon({
            className: 'center-drag-marker',
            html: `<div style="
              width: ${newSize}px;
              height: ${newSize}px;
              background: transparent;
              border: 2px dashed #3A5F76;
              border-radius: 8px;
              cursor: move;
              opacity: 0.3;
              pointer-events: auto;
            "></div>`,
            iconSize: [newSize, newSize],
            iconAnchor: [newSize / 2, newSize / 2]
          });
          centerMarkerRef.current.setIcon(newIcon);
        }
      }
    };

    // Escuchar eventos de zoom y movimiento para actualizar el marcador
    map.on('zoomend', updateCenterMarker);
    map.on('moveend', updateCenterMarker);

    return () => {
      map.off('zoomend', updateCenterMarker);
      map.off('moveend', updateCenterMarker);
    };
  }, [isEditMode, centerMarkerRef.current, map]);







  useEffect(() => {
    if (!map || !overlay || !map.getContainer()) return;

    // Remove existing overlay and corner markers
    if (overlayRef.current) {
      try {
        map.removeLayer(overlayRef.current);
        console.log('[Overlay] Removed previous overlay');
      } catch (error) {
        console.error('[Overlay] Error removing existing overlay:', error);
      }
      overlayRef.current = null;
    }

    // Remove corner markers
    cornerMarkersRef.current.forEach(marker => {
      try {
        map.removeLayer(marker);
      } catch (error) {
        console.error('[Overlay] Error removing corner marker:', error);
      }
    });
    cornerMarkersRef.current = [];

    // Remove center marker
    if (centerMarkerRef.current) {
      try {
        map.removeLayer(centerMarkerRef.current);
      } catch (error) {
        console.error('[Overlay] Error removing center marker:', error);
      }
      centerMarkerRef.current = null;
    }

    // Remove anchor point markers
    anchorPointMarkersRef.current.forEach(marker => {
      try {
        map.removeLayer(marker);
      } catch (error) {
        console.error('[Overlay] Error removing anchor point marker:', error);
      }
    });
    anchorPointMarkersRef.current = [];

    // Create bounds for the image overlay
    let bounds: L.LatLngBoundsExpression;
    
    if (overlay.anchorPoints) {
      // Use anchor points if available (more precise positioning)
      bounds = [
        [overlay.anchorPoints.bottomLeft.lat, overlay.anchorPoints.bottomLeft.lng],
        [overlay.anchorPoints.topRight.lat, overlay.anchorPoints.topRight.lng]
      ];
    } else {
      // Fallback to position-based bounds with scale applied
      const baseLat = overlay.position.lat;
      const baseLng = overlay.position.lng;
      const size = 0.01 * overlay.scale; // Apply scale to the size
      
      bounds = [
        [baseLat - size, baseLng - size],
        [baseLat + size, baseLng + size]
      ];
    }

          try {
        // Create new image overlay
        const imageOverlay = L.imageOverlay(overlay.imageUrl, bounds, {
          opacity: overlay.opacity || 1,
          interactive: true,
          bubblingMouseEvents: false // Evitar que los eventos se propaguen al mapa
        });

      // Add error handling for image loading
      const element = imageOverlay.getElement();
      if (element) {
        const img = element.querySelector('img');
        if (img) {
          img.onerror = () => {
            console.error('[Overlay] Error loading image:', overlay.imageUrl);
            setImageError(true);
          };
          img.onload = () => {
            setImageError(false);
          };
        }
      }

      // Apply rotation if needed
      if (overlay.rotation !== undefined && overlay.rotation !== 0) {
        const element = imageOverlay.getElement();
        if (element) {
          const currentTransform = element.style.transform;
          element.style.transform = `${currentTransform} rotate(${overlay.rotation}deg)`;
        }
      }

      // Add visual border in edit mode
      if (isEditMode) {
        const element = imageOverlay.getElement();
        if (element) {
          element.style.border = '4px solid #3A5F76';
          element.style.boxShadow = '0 0 15px rgba(58, 95, 118, 0.7)';
          element.style.borderRadius = '4px';
          element.style.zIndex = '1000';
          element.style.cursor = 'grab';
        }
      }

      // Add to map
      imageOverlay.addTo(map);
      overlayRef.current = imageOverlay;

      // Apply CSS class for edit mode styling
      if (isEditMode) {
        const element = imageOverlay.getElement();
        if (element) {
          element.classList.add('edit-mode-overlay');
        }
      }

      

              // Add corner markers and center drag marker if in edit mode
        if (isEditMode) {
          const boundsArray = bounds as [[number, number], [number, number]];
          const cornerPositions = [
            [boundsArray[0][0], boundsArray[0][1]], // Southwest
            [boundsArray[0][0], boundsArray[1][1]], // Southeast
            [boundsArray[1][0], boundsArray[1][1]], // Northeast
            [boundsArray[1][0], boundsArray[0][1]]  // Northwest
          ];

          // Add center drag marker (invisible but draggable)
          const centerLat = (boundsArray[0][0] + boundsArray[1][0]) / 2;
          const centerLng = (boundsArray[0][1] + boundsArray[1][1]) / 2;
          
          // Calcular el tamaño de la imagen en píxeles para el marcador
          const imageElement = imageOverlay.getElement();
          let imageWidth = 100;
          let imageHeight = 100;
          
          if (imageElement) {
            const rect = imageElement.getBoundingClientRect();
            imageWidth = rect.width;
            imageHeight = rect.height;
          }
          
          const centerMarker = L.marker([centerLat, centerLng], {
            draggable: true,
            icon: L.divIcon({
              className: 'center-drag-marker',
              html: `<div style="
                width: ${imageWidth}px;
                height: ${imageHeight}px;
                background: transparent;
                border: 2px dashed #3A5F76;
                border-radius: 8px;
                cursor: move;
                opacity: 0.3;
                pointer-events: auto;
              "></div>`,
              iconSize: [imageWidth, imageHeight],
              iconAnchor: [imageWidth / 2, imageHeight / 2]
            }),
            interactive: true,
            bubblingMouseEvents: false // Evitar que los eventos se propaguen al mapa
          });

          centerMarker.on('dragstart', () => {
            if (overlayRef.current) {
              const element = overlayRef.current.getElement();
              if (element) {
                // Get current rotation from the element's transform
                const currentTransform = element.style.transform;
                const rotationMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
                const currentRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
                
                if (currentRotation !== 0) {
                  // Store the current rotation to maintain it during drag
                  (element as any)._currentRotation = currentRotation;
                }
              }
            }
          });

          centerMarker.on('drag', () => {
            if (overlayRef.current) {
              const newCenter = centerMarker.getLatLng();
              const currentBounds = overlayRef.current.getBounds();
              
              // Calcular el centro actual de la imagen
              const currentCenterLat = (currentBounds.getSouthWest().lat + currentBounds.getNorthEast().lat) / 2;
              const currentCenterLng = (currentBounds.getSouthWest().lng + currentBounds.getNorthEast().lng) / 2;
              
              // Calcular la diferencia desde el centro actual
              const latDiff = newCenter.lat - currentCenterLat;
              const lngDiff = newCenter.lng - currentCenterLng;
              
              const newBounds = L.latLngBounds(
                [currentBounds.getSouthWest().lat + latDiff, currentBounds.getSouthWest().lng + lngDiff],
                [currentBounds.getNorthEast().lat + latDiff, currentBounds.getNorthEast().lng + lngDiff]
              );
              
              overlayRef.current.setBounds(newBounds);
              
              // Update corner markers
              const newCornerPositions = [
                [newBounds.getSouthWest().lat, newBounds.getSouthWest().lng], // Southwest
                [newBounds.getSouthWest().lat, newBounds.getNorthEast().lng], // Southeast
                [newBounds.getNorthEast().lat, newBounds.getNorthEast().lng], // Northeast
                [newBounds.getNorthEast().lat, newBounds.getSouthWest().lng]  // Northwest
              ];
              
              cornerMarkersRef.current.forEach((marker, index) => {
                marker.setLatLng(newCornerPositions[index] as [number, number]);
              });

              // Apply rotation during drag
              const element = overlayRef.current.getElement();
              if (element) {
                const storedRotation = (element as any)._currentRotation;
                if (storedRotation && storedRotation !== 0) {
                  const currentTransform = element.style.transform;
                  const transformWithoutRotation = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
                  element.style.transform = `${transformWithoutRotation} rotate(${storedRotation}deg)`;
                }
              }
            }
          });

          centerMarker.on('dragend', () => {
            if (overlayRef.current) {
              const element = overlayRef.current.getElement();
              if (element) {
                applyRotationToElement(element);
              }
            }
          });

          centerMarker.addTo(map);
          centerMarkerRef.current = centerMarker;
          
          // Agregar eventos para manejar la interacción con el mapa
          centerMarker.on('mousedown', (e) => {
            // Solo capturar eventos cuando se hace clic en el marcador
            e.originalEvent.stopPropagation();
          });
          
          centerMarker.on('click', (e) => {
            // Prevenir que el clic se propague al mapa
            e.originalEvent.stopPropagation();
          });
          
          // Update center marker position and size after drag ends
          centerMarker.on('dragend', () => {
            if (overlayRef.current && centerMarkerRef.current) {
              const currentBounds = overlayRef.current.getBounds();
              const newImageCenterLat = (currentBounds.getSouthWest().lat + currentBounds.getNorthEast().lat) / 2;
              const newImageCenterLng = (currentBounds.getSouthWest().lng + currentBounds.getNorthEast().lng) / 2;
              centerMarkerRef.current.setLatLng([newImageCenterLat, newImageCenterLng]);
              
              // Update center marker icon size to match new image size
              const imageElement = overlayRef.current.getElement();
              if (imageElement) {
                const rect = imageElement.getBoundingClientRect();
                const newIcon = L.divIcon({
                  className: 'center-drag-marker',
                  html: `<div style="
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    background: transparent;
                    border: 2px dashed #3A5F76;
                    border-radius: 8px;
                    cursor: move;
                    opacity: 0.3;
                    pointer-events: auto;
                  "></div>`,
                  iconSize: [rect.width, rect.height],
                  iconAnchor: [rect.width / 2, rect.height / 2]
                });
                centerMarkerRef.current.setIcon(newIcon);
              }
            }
          });

        cornerPositions.forEach((pos, index) => {
          const marker = L.marker(pos as [number, number], {
            draggable: true,
            icon: L.divIcon({
              className: 'corner-marker',
              html: `<div style="
                width: 16px;
                height: 16px;
                background: #3A5F76;
                border: 3px solid white;
                border-radius: 50%;
                cursor: move;
                box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 4px;
                  height: 4px;
                  background: white;
                  border-radius: 50%;
                "></div>
              </div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          });

          marker.on('dragstart', () => {
            if (overlayRef.current) {
              const element = overlayRef.current.getElement();
              if (element) {
                // Get current rotation from the element's transform
                const currentTransform = element.style.transform;
                const rotationMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
                const currentRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
                
                if (currentRotation !== 0) {
                  // Store the current rotation to maintain it during drag
                  (element as any)._currentRotation = currentRotation;
                }
              }
            }
          });

          marker.on('drag', () => {
            if (overlayRef.current) {
              // Get the current position of the dragged marker
              const draggedPosition = marker.getLatLng();
              
              // Determine which corner is being dragged based on the index
              // 0: Southwest, 1: Southeast, 2: Northeast, 3: Northwest
              let newBounds: L.LatLngBounds;
              
              if (index === 0) { // Southwest corner
                // Use the dragged position for southwest, keep northeast fixed
                const northeast = cornerMarkersRef.current[2].getLatLng();
                newBounds = L.latLngBounds(
                  [draggedPosition.lat, draggedPosition.lng], // Southwest
                  [northeast.lat, northeast.lng] // Northeast
                );
              } else if (index === 1) { // Southeast corner
                // Use the dragged position for southeast, keep northwest fixed
                const northwest = cornerMarkersRef.current[3].getLatLng();
                newBounds = L.latLngBounds(
                  [draggedPosition.lat, northwest.lng], // Southwest
                  [northwest.lat, draggedPosition.lng] // Northeast
                );
              } else if (index === 2) { // Northeast corner
                // Use the dragged position for northeast, keep southwest fixed
                const southwest = cornerMarkersRef.current[0].getLatLng();
                newBounds = L.latLngBounds(
                  [southwest.lat, southwest.lng], // Southwest
                  [draggedPosition.lat, draggedPosition.lng] // Northeast
                );
              } else { // index === 3: Northwest corner
                // Use the dragged position for northwest, keep southeast fixed
                const southeast = cornerMarkersRef.current[1].getLatLng();
                newBounds = L.latLngBounds(
                  [draggedPosition.lat, southeast.lng], // Southwest
                  [southeast.lat, draggedPosition.lng] // Northeast
                );
              }
              
              // Update overlay bounds
              overlayRef.current.setBounds(newBounds);
              
              // Update the other three corner markers based on the new bounds
              const newCornerPositions = [
                [newBounds.getSouthWest().lat, newBounds.getSouthWest().lng], // Southwest
                [newBounds.getSouthWest().lat, newBounds.getNorthEast().lng], // Southeast
                [newBounds.getNorthEast().lat, newBounds.getNorthEast().lng], // Northeast
                [newBounds.getNorthEast().lat, newBounds.getSouthWest().lng]  // Northwest
              ];
              
              // Update all markers except the one being dragged
              cornerMarkersRef.current.forEach((marker, idx) => {
                if (idx !== index) {
                  const newPos = newCornerPositions[idx];
                  marker.setLatLng(newPos as [number, number]);
                }
              });
              
              // Update center marker position and size
              if (centerMarkerRef.current) {
                const newImageCenterLat = (newBounds.getSouthWest().lat + newBounds.getNorthEast().lat) / 2;
                const newImageCenterLng = (newBounds.getSouthWest().lng + newBounds.getNorthEast().lng) / 2;
                centerMarkerRef.current.setLatLng([newImageCenterLat, newImageCenterLng]);
                
                // Update center marker icon size to match new image size
                const imageElement = overlayRef.current.getElement();
                if (imageElement) {
                  const rect = imageElement.getBoundingClientRect();
                  const newIcon = L.divIcon({
                    className: 'center-drag-marker',
                    html: `<div style="
                      width: ${rect.width}px;
                      height: ${rect.height}px;
                      background: transparent;
                      border: 2px dashed #3A5F76;
                      border-radius: 8px;
                      cursor: move;
                      opacity: 0.3;
                      pointer-events: auto;
                    "></div>`,
                    iconSize: [rect.width, rect.height],
                    iconAnchor: [rect.width / 2, rect.height / 2]
                  });
                  centerMarkerRef.current.setIcon(newIcon);
                }
              }

              // Apply rotation during corner drag
              const element = overlayRef.current.getElement();
              if (element) {
                const storedRotation = (element as any)._currentRotation;
                if (storedRotation && storedRotation !== 0) {
                  const currentTransform = element.style.transform;
                  const transformWithoutRotation = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
                  element.style.transform = `${transformWithoutRotation} rotate(${storedRotation}deg)`;
                }
              }
            }
          });

          marker.on('dragend', () => {
            if (overlayRef.current) {
              const element = overlayRef.current.getElement();
              if (element) {
                applyRotationToElement(element);
              }
            }
          });

          marker.addTo(map);
          cornerMarkersRef.current.push(marker);
        });
      }

    } catch (error) {
      console.error('[Overlay] Error creating image overlay:', error);
    }

    // Cleanup function
    return () => {
      // Cleanup básico
      if (overlayRef.current) {
        // No necesitamos limpiar eventos especiales en el nuevo enfoque
      }

      if (overlayRef.current && map.getContainer()) {
        try {
          map.removeLayer(overlayRef.current);
        } catch (error) {
          console.error('[Overlay] Error cleaning up overlay:', error);
        }
        overlayRef.current = null;
      }

      // Remove corner markers
      cornerMarkersRef.current.forEach(marker => {
        try {
          map.removeLayer(marker);
        } catch (error) {
          console.error('[Overlay] Error removing corner marker:', error);
        }
      });
      cornerMarkersRef.current = [];
    };
  }, [map, overlay.imageUrl, overlay.anchorPoints, overlay.position, overlay.scale, isEditMode]);

  // Update opacity when it changes
  useEffect(() => {
    if (overlayRef.current && overlay.opacity !== undefined) {
      overlayRef.current.setOpacity(overlay.opacity);
    }
  }, [overlay.opacity]);

  // Update rotation when it changes
  useEffect(() => {
    if (overlayRef.current && overlay.rotation !== undefined) {
      const element = overlayRef.current.getElement();
      if (element) {
        // Get the current transform and remove any existing rotation
        const currentTransform = element.style.transform;
        const transformWithoutRotation = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
        
        // Apply the new rotation
        if (overlay.rotation !== 0) {
          element.style.transform = `${transformWithoutRotation} rotate(${overlay.rotation}deg)`;
        } else {
          element.style.transform = transformWithoutRotation;
        }
      }
    }
  }, [overlay.rotation]);

  // Listen for map zoom and move events to maintain rotation
  useEffect(() => {
    if (!map || !overlayRef.current) return;

    const maintainRotation = () => {
      if (overlayRef.current && overlay.rotation !== undefined && overlay.rotation !== 0) {
        const element = overlayRef.current.getElement();
        if (element) {
          applyRotationToElement(element);
        }
      }
    };

    map.on('zoomend', maintainRotation);
    map.on('moveend', maintainRotation);

    return () => {
      map.off('zoomend', maintainRotation);
      map.off('moveend', maintainRotation);
    };
  }, [map, overlay.rotation]);

  // Function to apply rotation to overlay element
  const applyRotationToElement = (element: HTMLElement) => {
    if (overlay.rotation !== undefined && overlay.rotation !== 0) {
      // Use requestAnimationFrame to ensure Leaflet's transforms are applied first
      requestAnimationFrame(() => {
        const currentTransform = element.style.transform;
        const transformWithoutRotation = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
        element.style.transform = `${transformWithoutRotation} rotate(${overlay.rotation}deg)`;
      });
    }
  };

  // Show error message if image failed to load
  if (imageError) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          textAlign: 'center',
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
          ⚠️ Error al cargar el mapa
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          No se pudo cargar la imagen del mapa. 
          {overlay.imageUrl.includes('.pdf') && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Los PDFs deben ser convertidos a imagen antes de subirlos.
            </div>
          )}
        </div>
      </div>
    );
  }



  return null;
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

const Map: React.FC<MapProps> = ({ currentLocation, selectedMap, isEditMode, onEditComplete, onOpacityChange, onRotationChange, onReferencePointsClick, onMapReady }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid default
  const [zoom] = useState(13);
  const [isMapReady, setIsMapReady] = useState(false);

  // Update map center when location changes
  useEffect(() => {
    if (currentLocation) {
      // Remove debug logs to avoid console spam
      // console.log('Current location updated:', currentLocation);
      // Don't auto-center the map, only update the marker position
      // setMapCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);

  // Update map center when a map is selected
  useEffect(() => {
    if (selectedMap && isMapReady) {
      const { lat, lng } = selectedMap.position;
      setMapCenter([lat, lng]);
    }
  }, [selectedMap, isMapReady]);

  // Handle map ready state
  const handleMapReady = () => {
    setIsMapReady(true);
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>
        {isEditMode && `
          .leaflet-control-zoom {
            left: auto !important;
            right: 60px !important;
          }
        `}
      </style>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
                    style={{ 
              height: isEditMode ? 'calc(100vh - 80px)' : '100%', 
              width: '100%' 
            }}
        zoomControl={true}
        whenReady={handleMapReady}
      >
        {/* OpenStreetMap base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
                {/* Current location marker - hidden in edit mode */}
        {!isEditMode && <CurrentLocationMarker currentLocation={currentLocation} />}
        
        {/* Selected map overlay */}
        {selectedMap && isMapReady && (
          <ImageOverlayComponent 
            overlay={{
              ...selectedMap,
              // Apply scale and rotation transformations
              position: selectedMap.position,
              opacity: selectedMap.opacity
            }}
            isEditMode={isEditMode}
            onEditComplete={onEditComplete}
          />
        )}
        
        {/* Selected map marker */}
        {selectedMap && (
          <Marker
            position={[selectedMap.position.lat, selectedMap.position.lng]}
            icon={L.divIcon({
              className: 'selected-map-marker',
              html: `<div style="
                background: #3A5F76;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 2px solid white;
              ">${selectedMap.name}</div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })}
          />
        )}
        
        {/* Map updater component */}
        {isMapReady && <MapUpdater center={mapCenter} />}
        
        {/* Map reference capture component */}
        {onMapReady && <MapReferenceCapture onMapReady={onMapReady} />}
        
        {/* Center location button - hidden in edit mode */}
        {!isEditMode && <CenterLocationButton currentLocation={currentLocation} />}
        

        
        {/* Clear map selection button */}
        {selectedMap && !isEditMode && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: '#E74C3C',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              // This will be handled by the parent component
              window.dispatchEvent(new CustomEvent('clearMapSelection'));
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#C53030';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#E74C3C';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
            title="Limpiar selección de mapa"
          >
            ✕ Limpiar mapa
          </div>
        )}


      </MapContainer>
      
      {/* Edit mode bottom bar with buttons and opacity slider - outside map container */}
      {selectedMap && isEditMode && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '16px 20px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '80px',
            boxSizing: 'border-box'
          }}
        >
          {/* Left side - Sliders */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Opacity slider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                minWidth: '80px'
              }}>
                Transparencia:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={selectedMap.opacity ? Math.round(selectedMap.opacity * 100) : 100}
                style={{
                  width: '200px',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#ddd',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onChange={(e) => {
                  const opacity = parseInt(e.target.value) / 100;
                  if (onOpacityChange) {
                    onOpacityChange(opacity);
                  }
                }}
              />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                minWidth: '40px',
                textAlign: 'center'
              }}>
                {selectedMap.opacity ? Math.round(selectedMap.opacity * 100) : 100}%
              </span>
            </div>
            
            {/* Rotation slider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                minWidth: '80px'
              }}>
                Rotación:
              </span>
              <input
                type="range"
                min="-10"
                max="10"
                defaultValue={selectedMap.rotation || 0}
                style={{
                  width: '200px',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#ddd',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onChange={(e) => {
                  const rotation = parseInt(e.target.value);
                  if (onRotationChange) {
                    onRotationChange(rotation);
                  }
                }}
              />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                minWidth: '40px',
                textAlign: 'center'
              }}>
                {selectedMap.rotation || 0}°
              </span>
            </div>
          </div>
          
          {/* Right side - Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            {/* Reference Points Button */}
            <button
              style={{
                backgroundColor: '#3498DB',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={onReferencePointsClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2980B9';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3498DB';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Ajustar por puntos de referencia"
            >
              📍 Ajustar por puntos
            </button>
            <button
              style={{
                backgroundColor: '#E74C3C',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                // This will be handled by the parent component
                window.dispatchEvent(new CustomEvent('cancelMapEdit'));
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C53030';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E74C3C';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Cancelar edición"
            >
              ❌
            </button>
            
            <button
              style={{
                backgroundColor: '#27AE60',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                // Get current bounds, anchor points and calculated center position
                const currentData = (window as any).getCurrentOverlayBounds?.();
                if (currentData) {
                  onEditComplete(currentData.bounds);
                  
                  // Store anchor points and calculated center for the modal
                  (window as any).currentAnchorPoints = currentData.anchorPoints;
                  (window as any).currentCenterPosition = currentData.centerPosition;
                }
                
                // This will be handled by the parent component
                window.dispatchEvent(new CustomEvent('confirmMapEdit'));
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#229954';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#27AE60';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Confirmar edición"
            >
              ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map; 