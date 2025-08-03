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
  const [imageError, setImageError] = useState(false);
  
  // Variables para el nuevo sistema de arrastre
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; bounds: L.LatLngBounds } | null>(null);
  const customOverlayRef = useRef<HTMLDivElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  


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

  // useEffect para deshabilitar interacciones del mapa en modo de edición
  useEffect(() => {
    if (isEditMode) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
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

  // Función para manejar el inicio del arrastre de la imagen
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bounds: overlayRef.current?.getBounds() || L.latLngBounds([0, 0], [0, 0])
    };
    
    // Cambiar el cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // Función para manejar el arrastre de la imagen
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current || !overlayRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Convertir el desplazamiento en píxeles a coordenadas geográficas
    const startPoint = map.containerPointToLatLng([0, 0]);
    const endPoint = map.containerPointToLatLng([dx, dy]);
    
    const latOffset = endPoint.lat - startPoint.lat;
    const lngOffset = endPoint.lng - startPoint.lng;
    
    // Obtener los bounds originales
    const originalBounds = dragStartRef.current.bounds;
    
    // Crear nuevos bounds desplazados
    const newBounds = L.latLngBounds(
      [originalBounds.getSouthWest().lat + latOffset, originalBounds.getSouthWest().lng + lngOffset],
      [originalBounds.getNorthEast().lat + latOffset, originalBounds.getNorthEast().lng + lngOffset]
    );
    
    // Actualizar la posición de la imagen
    overlayRef.current.setBounds(newBounds);
    
    // Actualizar la posición de los marcadores de esquina
    if (cornerMarkersRef.current.length > 0) {
      const newCornerPositions = [
        [newBounds.getSouthWest().lat, newBounds.getSouthWest().lng], // Southwest
        [newBounds.getSouthWest().lat, newBounds.getNorthEast().lng], // Southeast
        [newBounds.getNorthEast().lat, newBounds.getNorthEast().lng], // Northeast
        [newBounds.getNorthEast().lat, newBounds.getSouthWest().lng]  // Northwest
      ];
      
      cornerMarkersRef.current.forEach((marker, index) => {
        marker.setLatLng(newCornerPositions[index] as [number, number]);
      });
    }
    
    // Actualizar la posición del overlay en tiempo real durante el arrastre
    if (overlayRef.current) {
      const element = overlayRef.current.getElement();
      if (element) {
        const rect = element.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();
        
        setOverlayPosition({
          top: rect.top - mapRect.top,
          left: rect.left - mapRect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }
  };

  // Función para manejar el fin del arrastre de la imagen
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isDraggingRef.current = false;
    dragStartRef.current = null;
    
    // Restaurar el cursor y la selección de texto
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Actualizar la posición del overlay después del arrastre
    if (overlayRef.current) {
      const element = overlayRef.current.getElement();
      if (element) {
        const rect = element.getBoundingClientRect();
        const mapRect = map.getContainer().getBoundingClientRect();
        
        setOverlayPosition({
          top: rect.top - mapRect.top,
          left: rect.left - mapRect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }
  };

  // useEffect para manejar eventos globales de mouse
  useEffect(() => {
    if (!isEditMode) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Convertir el evento a React.MouseEvent para handleMouseMove
        const reactEvent = e as any;
        handleMouseMove(reactEvent);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        // Convertir el evento a React.MouseEvent para handleMouseUp
        const reactEvent = e as any;
        handleMouseUp(reactEvent);
      }
    };

    // Agregar eventos globales para manejar el arrastre fuera del elemento
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isEditMode]);

  // useEffect para actualizar la posición del overlay cuando cambie la vista del mapa
  useEffect(() => {
    if (!isEditMode || !overlayRef.current) return;

    const updateOverlayPosition = () => {
      if (overlayRef.current) {
        const element = overlayRef.current.getElement();
        if (element) {
          const rect = element.getBoundingClientRect();
          const mapRect = map.getContainer().getBoundingClientRect();
          
          setOverlayPosition({
            top: rect.top - mapRect.top,
            left: rect.left - mapRect.left,
            width: rect.width,
            height: rect.height
          });
        }
      }
    };

    // Actualizar posición inicial
    updateOverlayPosition();

    // Escuchar cambios en la vista del mapa
    map.on('move', updateOverlayPosition);
    map.on('zoom', updateOverlayPosition);
    map.on('resize', updateOverlayPosition);

    return () => {
      map.off('move', updateOverlayPosition);
      map.off('zoom', updateOverlayPosition);
      map.off('resize', updateOverlayPosition);
    };
  }, [isEditMode, map, overlayRef.current]);

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
        opacity: overlay.opacity,
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
      if (overlay.rotation !== 0) {
        const element = imageOverlay.getElement();
        if (element) {
          element.style.transform += ` rotate(${overlay.rotation}deg)`;
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

      

              // Add corner markers if in edit mode
        if (isEditMode) {
          const boundsArray = bounds as [[number, number], [number, number]];
          const cornerPositions = [
            [boundsArray[0][0], boundsArray[0][1]], // Southwest
            [boundsArray[0][0], boundsArray[1][1]], // Southeast
            [boundsArray[1][0], boundsArray[1][1]], // Northeast
            [boundsArray[1][0], boundsArray[0][1]]  // Northwest
          ];

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
  }, [map, overlay, isEditMode]);

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

  // Renderizar el div personalizado para arrastre en modo de edición
  if (isEditMode && overlayRef.current && overlayPosition.width > 0) {
    return (
      <div
        ref={customOverlayRef}
        style={{
          position: 'absolute',
          top: overlayPosition.top,
          left: overlayPosition.left,
          width: overlayPosition.width,
          height: overlayPosition.height,
          cursor: 'grab',
          zIndex: 1001,
          pointerEvents: 'auto',
          border: '2px dashed #3A5F76',
          backgroundColor: 'rgba(58, 95, 118, 0.1)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        title="Arrastra para mover el mapa"
      />
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

const Map: React.FC<MapProps> = ({ currentLocation, selectedMap, isEditMode, onEditComplete }) => {
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
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        whenReady={handleMapReady}
      >
        {/* OpenStreetMap base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
                {/* Current location marker */}
        <CurrentLocationMarker currentLocation={currentLocation} />
        
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
        
        {/* Center location button */}
        <CenterLocationButton currentLocation={currentLocation} />
        
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

        {/* Confirm edit button */}
        {selectedMap && isEditMode && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: '#27AE60',
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
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#27AE60';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
            title="Confirmar edición"
          >
            ✅ Confirmar posición
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default Map; 