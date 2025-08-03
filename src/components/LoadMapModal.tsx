import React, { useState, useRef } from 'react';
import { fileService, overlayService } from '../services/supabase';
import { AuthUser } from '../services/auth';
import { PDFConverter } from '../services/pdfConverter';
import PDFConversionModal from './PDFConversionModal';

interface LoadMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onMapLoaded: () => void;
}

const LoadMapModal: React.FC<LoadMapModalProps> = ({ isOpen, onClose, user, onMapLoaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mapName, setMapName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPDF, setIsPDF] = useState(false);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PDF, JPG, PNG y TIFF.');
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
    setConvertedFile(null);
    
    // Verificar si es un PDF
    const isPDFFile = PDFConverter.isPDF(file);
    setIsPDF(isPDFFile);
    
    // Si es PDF, abrir modal de conversión automáticamente
    if (isPDFFile) {
      setShowPDFModal(true);
    }
    
    // Establecer nombre por defecto si no se ha especificado
    if (!mapName) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remover extensión
      setMapName(fileName);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo.');
      return;
    }
    
    if (!mapName.trim()) {
      setError('Por favor, especifica un nombre para el mapa.');
      return;
    }
    
    if (!user) {
      setError('Debes estar autenticado para cargar mapas.');
      return;
    }

    // Para PDFs, necesitamos que se haya convertido primero
    if (isPDF && !convertedFile) {
      setError('Por favor, convierte el PDF a imagen antes de continuar.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Usar el archivo correcto según el tipo
      let fileToUpload: File;
      
      if (isPDF && convertedFile) {
        // Si es un PDF y se ha convertido, usar el archivo convertido
        fileToUpload = convertedFile;
      } else {
        // Para imágenes normales o PDFs no convertidos, usar el archivo seleccionado
        fileToUpload = selectedFile;
      }
      
      // Subir archivo
      const imageUrl = await fileService.uploadImage(fileToUpload, user.id);
      
      // Crear overlay en la base de datos
      await overlayService.createOverlay({
        name: mapName.trim(),
        imageUrl,
        opacity: 0.7,
        scale: 1.0,
        rotation: 0,
        position: { lat: 0, lng: 0 }, // Posición por defecto
        userId: user.id
      });

      // Limpiar formulario
      setSelectedFile(null);
      setMapName('');
      setConvertedFile(null);
      setIsPDF(false);
      setShowPDFModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onMapLoaded();
      onClose();
    } catch (err: any) {
      console.error('Error loading map:', err);
      setError(`Error al cargar el mapa: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Limpiar URLs de objetos para evitar memory leaks
      if (selectedFile) {
        URL.revokeObjectURL(URL.createObjectURL(selectedFile));
      }
      if (convertedFile) {
        URL.revokeObjectURL(URL.createObjectURL(convertedFile));
      }
      
      setSelectedFile(null);
      setMapName('');
      setError('');
      setConvertedFile(null);
      setIsPDF(false);
      setShowPDFModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const handlePDFConversionComplete = (convertedFile: File, width: number, height: number) => {
    console.log('PDF conversion completed:', convertedFile.name, convertedFile.size);
    
    setConvertedFile(convertedFile);
    setError('');
    setShowPDFModal(false);
    
    // Actualizar el archivo seleccionado para que sea el archivo convertido
    setSelectedFile(convertedFile);
    setIsPDF(false); // Ya no es un PDF, es una imagen
    
    // Actualizar el nombre del mapa si no se ha especificado
    if (!mapName) {
      const fileName = convertedFile.name.replace(/\.[^/.]+$/, ''); // Remover extensión
      setMapName(fileName);
    }
    
    console.log('State updated - selectedFile:', convertedFile.name, 'isPDF:', false);
  };

  const handlePDFModalClose = () => {
    setShowPDFModal(false);
    // Si se cierra el modal sin convertir, limpiar el archivo seleccionado
    if (isPDF && !convertedFile) {
      setSelectedFile(null);
      setIsPDF(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

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
          zIndex: 2000
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        zIndex: 2001,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            fontFamily: 'Inter, sans-serif'
          }}>
            Cargar Mapa
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              fontFamily: 'Inter, sans-serif'
            }}>
              Nombre del Mapa
            </label>
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Introduce el nombre del mapa"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
            />
          </div>



          {/* Botón para seleccionar archivo */}
          {!selectedFile && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                📁 Seleccionar Archivo
              </button>
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280',
                fontFamily: 'Inter, sans-serif'
              }}>
                Formatos permitidos: PDF, JPG, PNG, TIFF. Máximo 10MB.
              </div>
              
              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
                onChange={handleFileSelect}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {selectedFile && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: convertedFile ? '#d1fae5' : '#f3f4f6',
              border: convertedFile ? '1px solid #a7f3d0' : 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: convertedFile ? '#065f46' : '#1f2937'
            }}>
              <strong>
                {convertedFile ? '✅ Archivo listo para subir:' : 
                 isPDF ? '📄 PDF seleccionado (requiere conversión):' : '🖼️ Imagen seleccionada:'}
              </strong> {selectedFile.name} 
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              {convertedFile && (
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                  PDF convertido a imagen JPEG
                </div>
              )}
              {!convertedFile && isPDF && (
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8, color: '#f59e0b' }}>
                  Haz clic en "Convertir PDF a Imagen" para continuar
                </div>
              )}
            </div>
          )}

          {/* Botón para cambiar archivo */}
          {selectedFile && (
            <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '17px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }}
              >
                🔄 Cambiar Archivo
              </button>
            </div>
          )}

          {/* Previsualización de la imagen (solo para archivos que no son PDFs) */}
          {selectedFile && !isPDF && !convertedFile && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '14px', 
                color: '#495057',
                fontWeight: '500'
              }}>
                Previsualización:
              </h4>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Previsualización del mapa"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = 
                      '<div style="padding: 20px; text-align: center; color: #6b7280;">No se pudo cargar la previsualización</div>';
                  }}
                />
              </div>
            </div>
          )}

          {/* Previsualización de la imagen convertida o final */}
          {convertedFile && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '14px', 
                color: '#495057',
                fontWeight: '500'
              }}>
                Previsualización:
              </h4>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                <img
                  src={URL.createObjectURL(convertedFile)}
                  alt="Previsualización del mapa convertido"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = 
                      '<div style="padding: 20px; text-align: center; color: #6b7280;">No se pudo cargar la previsualización</div>';
                  }}
                />
              </div>
            </div>
          )}

          {/* Mostrar botón para convertir PDF si es un PDF y no se ha convertido */}
          {selectedFile && isPDF && !convertedFile && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: '#92400e'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>📄 Archivo PDF detectado:</strong> {selectedFile.name}
              </div>
              <button
                type="button"
                onClick={() => setShowPDFModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d97706';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f59e0b';
                }}
              >
                🔄 Convertir PDF a Imagen
              </button>
            </div>
          )}


          


          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif'
            }}>
              {error}
            </div>
          )}



          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !mapName.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading || !selectedFile || !mapName.trim() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading || !selectedFile || !mapName.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
              onClick={() => {
                console.log('Button clicked - Debug info:');
                console.log('isLoading:', isLoading);
                console.log('selectedFile:', selectedFile?.name, selectedFile?.size);
                console.log('mapName:', mapName);
                console.log('convertedFile:', convertedFile?.name);
                console.log('isPDF:', isPDF);
              }}
            >
              {isLoading ? 'Cargando...' : 'Cargar Mapa'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de conversión de PDF */}
      {selectedFile && isPDF && (
        <PDFConversionModal
          isOpen={showPDFModal}
          onClose={handlePDFModalClose}
          file={selectedFile}
          onConversionComplete={handlePDFConversionComplete}
        />
      )}
    </>
  );
};

export default LoadMapModal; 