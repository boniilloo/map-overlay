import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import { OverlayData, Point } from '../types';

interface ReferencePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: OverlayData | null;
  onPointsSelected: (imagePoints: Point[], mapPoints: Point[]) => void;
}

const ReferencePointsModal: React.FC<ReferencePointsModalProps> = ({ 
  isOpen, 
  onClose, 
  map, 
  onPointsSelected 
}) => {
  const [numPoints, setNumPoints] = useState(4);
  const [currentStep, setCurrentStep] = useState<'image' | 'map' | 'preview'>('image');
  const [imagePoints, setImagePoints] = useState<Point[]>([]);
  const [mapPoints, setMapPoints] = useState<Point[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [transformedPoints, setTransformedPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

  // Component for handling map clicks
  const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
    const map = useMap();

    useEffect(() => {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      };

      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }, [map, onMapClick]);

    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('image');
      setImagePoints([]);
      setMapPoints([]);
      setImageZoom(1);
      setImagePan({ x: 0, y: 0 });
      
      // Cargar dimensiones de la imagen
      if (map?.imageUrl) {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => {
          console.error('Error al cargar la imagen para obtener dimensiones');
          setImageDimensions(null);
        };
        img.src = map.imageUrl;
      }
    }
  }, [isOpen, map?.imageUrl]);

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (currentStep !== 'image' || imagePoints.length >= numPoints) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Obtener las dimensiones del contenedor y de la imagen original
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    if (!imageDimensions) {
      console.error('No se han cargado las dimensiones de la imagen');
      return;
    }
    
    // Calcular la escala de la imagen mostrada vs la imagen original
    const scaleX = imageDimensions.width / containerWidth;
    const scaleY = imageDimensions.height / containerHeight;
    
    // Convertir coordenadas del clic a coordenadas de la imagen original
    // Primero aplicar zoom y pan al clic
    const adjustedX = (clickX - imagePan.x) / imageZoom;
    const adjustedY = (clickY - imagePan.y) / imageZoom;
    
    // Luego escalar a las dimensiones reales de la imagen
    const imageX = adjustedX * scaleX;
    const imageY = adjustedY * scaleY;
    
    // Verificar límites de la imagen original
    if (imageX >= 0 && imageY >= 0 && imageX <= imageDimensions.width && imageY <= imageDimensions.height) {
      const newPoint: Point = {
        id: imagePoints.length + 1,
        lat: 0,
        lng: 0,
        x: imageX,
        y: imageY
      };
      setImagePoints([...imagePoints, newPoint]);
      
      console.log('=== PUNTO DE IMAGEN AGREGADO ===');
      console.log('Coordenadas del clic:', { clickX, clickY });
      console.log('Dimensiones del contenedor:', { containerWidth, containerHeight });
      console.log('Dimensiones de la imagen original:', imageDimensions);
      console.log('Escalas calculadas:', { scaleX, scaleY });
      console.log('Estado de zoom y pan:', { imageZoom, imagePan });
      console.log('Coordenadas ajustadas (zoom/pan):', { adjustedX, adjustedY });
      console.log('Coordenadas finales de imagen:', { imageX, imageY });
      console.log('Punto completo:', newPoint);
      console.log('Todos los puntos de imagen:', [...imagePoints, newPoint]);
      console.log('================================');
    } else {
      console.log('Clic fuera de los límites de la imagen:', { imageX, imageY, limits: imageDimensions });
    }
  };

  const handleImageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, imageZoom * delta));
    setImageZoom(newZoom);
  };

  const handleImageMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      setIsDragging(true);
      setDragStart({ x: event.clientX - imagePan.x, y: event.clientY - imagePan.y });
    }
  };

  const handleImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setImagePan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleImageMouseUp = () => {
    setIsDragging(false);
  };

  const resetImageView = () => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (currentStep !== 'map' || mapPoints.length >= numPoints) return;
    
    const newPoint: Point = {
      id: mapPoints.length + 1,
      lat: lat,
      lng: lng,
      x: 0,
      y: 0
    };

    setMapPoints([...mapPoints, newPoint]);
    
    console.log('=== PUNTO DE MAPA AGREGADO ===');
    console.log('Coordenadas del clic:', { lat, lng });
    console.log('Punto completo:', newPoint);
    console.log('Todos los puntos de mapa:', [...mapPoints, newPoint]);
    console.log('================================');
  };

  const handleNextStep = () => {
    if (currentStep === 'image' && imagePoints.length === numPoints) {
      setCurrentStep('map');
      // Limpiar puntos del mapa al cambiar de paso
      setMapPoints([]);
    } else if (currentStep === 'map' && mapPoints.length === numPoints) {
      // Calcular las coordenadas transformadas antes de ir a preview
      calculateTransformedPoints();
      setCurrentStep('preview');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'map') {
      setCurrentStep('image');
      // Limpiar puntos de la imagen al volver
      setImagePoints([]);
    } else if (currentStep === 'preview') {
      setCurrentStep('map');
      // Limpiar puntos del mapa al volver
      setMapPoints([]);
    }
  };

  const handleSave = () => {
    if (imagePoints.length === numPoints && mapPoints.length === numPoints) {
      onPointsSelected(imagePoints, mapPoints);
      onClose();
    }
  };

  const calculateTransformedPoints = () => {
    // Usar las coordenadas reales del mapa seleccionado
    const transformed = imagePoints.map((point, index) => {
      const mapPoint = mapPoints[index];
      return {
        lat: mapPoint.lat,
        lng: mapPoint.lng
      };
    });
    setTransformedPoints(transformed);
  };

  // Calcular bounds para la imagen overlay
  const calculateImageBounds = () => {
    if (transformedPoints.length < 2) return null;
    
    const lats = transformedPoints.map(p => p.lat);
    const lngs = transformedPoints.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Agregar un pequeño margen
    const latMargin = (maxLat - minLat) * 0.1;
    const lngMargin = (maxLng - minLng) * 0.1;
    
    return L.latLngBounds(
      [minLat - latMargin, minLng - lngMargin],
      [maxLat + latMargin, maxLng + lngMargin]
    );
  };

  const removePoint = (pointId: number, isImage: boolean) => {
    if (isImage) {
      setImagePoints(imagePoints.filter(p => p.id !== pointId));
    } else {
      setMapPoints(mapPoints.filter(p => p.id !== pointId));
    }
  };

  if (!isOpen || !map) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
            width: '95%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              Ajustar por Puntos de Referencia
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Selecciona puntos de referencia en la imagen y en el mapa
            </p>
          </div>

          {/* Step Indicator */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <div style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: currentStep === 'image' ? '#3A5F76' : '#e5e7eb',
                color: currentStep === 'image' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                1. Imagen ({imagePoints.length}/{numPoints})
              </div>
              <div style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: currentStep === 'map' ? '#3A5F76' : '#e5e7eb',
                color: currentStep === 'map' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                2. Mapa ({mapPoints.length}/{numPoints})
              </div>
              <div style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: currentStep === 'preview' ? '#3A5F76' : '#e5e7eb',
                color: currentStep === 'preview' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                3. Vista Previa
              </div>
            </div>
          </div>

          {/* Step 1: Select points on image */}
          {currentStep === 'image' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ color: '#374151', margin: 0 }}>
                    Haz clic en {numPoints} puntos de la imagen
                  </h3>
                  {imageDimensions && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Dimensiones: {imageDimensions.width} x {imageDimensions.height} píxeles
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Puntos:</span>
                  <select
                    value={numPoints}
                    onChange={(e) => {
                      const newNumPoints = parseInt(e.target.value);
                      setNumPoints(newNumPoints);
                      // Limpiar puntos si el nuevo número es menor
                      if (newNumPoints < imagePoints.length) {
                        setImagePoints(imagePoints.slice(0, newNumPoints));
                      }
                      if (newNumPoints < mapPoints.length) {
                        setMapPoints(mapPoints.slice(0, newNumPoints));
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>
              
              {/* Image controls */}
              <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setImageZoom(Math.min(3, imageZoom + 0.2))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔍+
                </button>
                <button
                  onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.2))}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔍-
                </button>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Zoom: {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={resetImageView}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Reset
                </button>
              </div>

              {/* Image container */}
              <div 
                style={{ 
                  position: 'relative', 
                  display: 'inline-block',
                  overflow: 'hidden',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: isDragging ? 'grabbing' : 'crosshair'
                }}
                onClick={handleImageClick}
                onWheel={handleImageWheel}
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
              >
                <div
                  style={{
                    transform: `scale(${imageZoom}) translate(${imagePan.x / imageZoom}px, ${imagePan.y / imageZoom}px)`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.1s ease',
                    position: 'relative'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={map.imageUrl}
                    alt="Mapa para ajustar"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      display: 'block',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Puntos dentro del contenedor transformado */}
                  {imagePoints.map((point, index) => (
                    <div
                      key={point.id}
                      style={{
                        position: 'absolute',
                        left: point.x - 10,
                        top: point.y - 10,
                        width: '20px',
                        height: '20px',
                        backgroundColor: colors[index],
                        borderRadius: '50%',
                        border: '2px solid white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        pointerEvents: 'auto',
                        zIndex: 1000
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePoint(point.id, true);
                      }}
                      title={`Punto ${point.id} - Clic para eliminar`}
                    >
                      {point.id}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: '15px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Puntos seleccionados: {imagePoints.length}/{numPoints}
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {imagePoints.length > 0 && (
                    <button
                      onClick={() => setImagePoints([])}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #dc2626',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Limpiar todos los puntos
                    </button>
                  )}
                  <button
                    onClick={resetImageView}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #6b7280',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Resetear vista
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select points on map */}
          {currentStep === 'map' && (
            <div>
              <h3 style={{ marginBottom: '15px', color: '#374151' }}>
                Haz clic en {numPoints} puntos del mapa
              </h3>
              <div 
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '400px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <MapContainer
                  center={[40.4168, -3.7038]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {mapPoints.map((point, index) => (
                    <Marker
                      key={point.id}
                      position={[point.lat, point.lng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="
                          width: 20px;
                          height: 20px;
                          background-color: ${colors[index]};
                          border-radius: 50%;
                          border: 2px solid white;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 12px;
                          font-weight: bold;
                          color: white;
                          cursor: pointer;
                        ">${point.id}</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                      eventHandlers={{
                        click: () => removePoint(point.id, false)
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
              <div style={{ marginTop: '15px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Puntos seleccionados: {mapPoints.length}/{numPoints}
                </p>
                {mapPoints.length > 0 && (
                  <button
                    onClick={() => setMapPoints([])}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #dc2626',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginTop: '10px'
                    }}
                  >
                    Limpiar todos los puntos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && (
            <div>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#374151', margin: 0 }}>
                  Vista Previa de la Transformación
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Revisa cómo se posicionará la imagen en el mapa
                </p>
              </div>

              {/* Mapa con imagen posicionada */}
              <div style={{ 
                height: '400px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                marginBottom: '20px',
                position: 'relative'
              }}>
                <MapContainer
                  center={[36.7, -3.5]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Imagen overlay posicionada */}
                  {imageRef.current && transformedPoints.length >= 2 && (
                    <ImageOverlay
                      url={map.imageUrl}
                      bounds={calculateImageBounds() || L.latLngBounds([36.7, -3.5], [36.7, -3.5])}
                      opacity={0.7}
                    />
                  )}
                  
                  {/* Marcadores de los puntos del mapa */}
                  {mapPoints.map((point, index) => (
                    <Marker
                      key={`map-${point.id}`}
                      position={[point.lat, point.lng]}
                      icon={L.divIcon({
                        className: 'map-point-marker',
                        html: `<div style="
                          background: ${colors[index]};
                          color: white;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          border: 2px solid white;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 12px;
                          font-weight: bold;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">${point.id}</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                    />
                  ))}
                  
                  {/* Marcadores de los puntos transformados */}
                  {transformedPoints.map((point, index) => (
                    <Marker
                      key={`transformed-${index}`}
                      position={[point.lat, point.lng]}
                      icon={L.divIcon({
                        className: 'transformed-point-marker',
                        html: `<div style="
                          background: ${colors[index]};
                          color: white;
                          width: 16px;
                          height: 16px;
                          border-radius: 50%;
                          border: 2px solid white;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 10px;
                          font-weight: bold;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">T</div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      })}
                    />
                  ))}
                </MapContainer>
              </div>

              {/* Información de coordenadas */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Puntos del mapa */}
                <div>
                  <h4 style={{ color: '#374151', margin: '0 0 10px 0', fontSize: '16px' }}>
                    Puntos Seleccionados en el Mapa
                  </h4>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '15px',
                    border: '2px solid #e5e7eb'
                  }}>
                    {mapPoints.map((point, index) => (
                      <div key={point.id} style={{ marginBottom: '10px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '5px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: colors[index],
                            borderRadius: '50%',
                            border: '2px solid white'
                          }} />
                          <span style={{ fontWeight: 'bold', color: '#374151' }}>
                            Punto {point.id}:
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginLeft: '24px' }}>
                          <div>Lat: {point.lat.toFixed(6)}</div>
                          <div>Lng: {point.lng.toFixed(6)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Puntos de la imagen */}
                <div>
                  <h4 style={{ color: '#374151', margin: '0 0 10px 0', fontSize: '16px' }}>
                    Puntos Seleccionados en la Imagen
                  </h4>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    padding: '15px',
                    border: '2px solid #e5e7eb'
                  }}>
                    {imagePoints.map((point, index) => (
                      <div key={point.id} style={{ marginBottom: '10px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '5px'
                        }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: colors[index],
                            borderRadius: '50%',
                            border: '2px solid white'
                          }} />
                          <span style={{ fontWeight: 'bold', color: '#374151' }}>
                            Punto {point.id}:
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginLeft: '24px' }}>
                          <div>X: {point.x.toFixed(1)}px</div>
                          <div>Y: {point.y.toFixed(1)}px</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <h4 style={{ color: '#0c4a6e', margin: '0 0 8px 0', fontSize: '14px' }}>
                  Información de la Transformación
                </h4>
                <div style={{ fontSize: '14px', color: '#0369a1' }}>
                  <div>• Número de puntos: {numPoints}</div>
                  <div>• Dimensiones de imagen: {imageDimensions ? `${imageDimensions.width} x ${imageDimensions.height} píxeles` : 'Cargando...'}</div>
                  <div>• Transformación aplicada: Semejanza (escala + rotación + traslación)</div>
                  <div>• Leyenda: Círculos grandes = puntos del mapa, Círculos pequeños con "T" = puntos transformados</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
            <div>
              {(currentStep === 'map' || currentStep === 'preview') && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Anterior
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              
              {currentStep === 'image' && imagePoints.length === numPoints && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A5F76',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Continuar
                </button>
              )}
              
              {currentStep === 'map' && mapPoints.length === numPoints && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3A5F76',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Continuar
                </button>
              )}
              
              {currentStep === 'preview' && (
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#27AE60',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Ajustar Mapa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReferencePointsModal; 