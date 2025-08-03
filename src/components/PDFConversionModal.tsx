import React, { useState, useEffect } from 'react';
import { PDFConverter, PDFConversionOptions } from '../services/pdfConverter';

interface PDFConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  onConversionComplete: (convertedFile: File, width: number, height: number) => void;
}

const PDFConversionModal: React.FC<PDFConversionModalProps> = ({ 
  isOpen, 
  onClose, 
  file, 
  onConversionComplete 
}) => {
  const [pdfInfo, setPdfInfo] = useState<{ numPages: number; fileName: string } | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [quality, setQuality] = useState(0.8);
  const [isConverting, setIsConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState('');

  // Cargar información del PDF al montar el componente
  useEffect(() => {
    if (isOpen && file) {
      loadPDFInfo();
    }
  }, [isOpen, file]);

  // Generar previsualización cuando cambien los parámetros
  useEffect(() => {
    if (pdfInfo && selectedPage <= pdfInfo.numPages && isOpen) {
      generatePreview();
    }
  }, [selectedPage, scale, quality, pdfInfo, isOpen]);

  const loadPDFInfo = async () => {
    try {
      setError('');
      const info = await PDFConverter.getPDFInfo(file);
      setPdfInfo(info);
      setSelectedPage(1);
    } catch (error) {
      setError(`Error al cargar información del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const generatePreview = async () => {
    if (!pdfInfo) return;

    try {
      setIsConverting(true);
      setConversionProgress(0);
      setError('');

      // Simular progreso
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const options: PDFConversionOptions = {
        scale: scale,
        pageNumber: selectedPage,
        quality: quality
      };

      const { url, width, height } = await PDFConverter.convertPDFToImageURL(file, options);
      
      clearInterval(progressInterval);
      setConversionProgress(100);
      
      setPreviewUrl(url);
    } catch (error) {
      setError(`Error al generar previsualización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const handleConvertAndSubmit = async () => {
    if (!pdfInfo) return;

    try {
      setIsConverting(true);
      setConversionProgress(0);
      setError('');

      const options: PDFConversionOptions = {
        scale: scale,
        pageNumber: selectedPage,
        quality: quality
      };

      const { blob, width, height } = await PDFConverter.convertPDFToImage(file, options);
      
      // Crear un nuevo archivo con el nombre del PDF pero extensión .jpg
      const fileName = file.name.replace(/\.pdf$/i, '.jpg');
      const convertedFile = new File([blob], fileName, { type: 'image/jpeg' });
      
      onConversionComplete(convertedFile, width, height);
      // No llamar handleClose aquí, dejar que el componente padre maneje el cierre
    } catch (error) {
      setError(`Error al convertir PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const handleClose = () => {
    if (!isConverting) {
      // Limpiar URL de previsualización
      if (previewUrl) {
        PDFConverter.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Resetear estado
      setPdfInfo(null);
      setSelectedPage(1);
      setScale(1.5);
      setQuality(0.8);
      setIsConverting(false);
      setConversionProgress(0);
      setError('');
      
      onClose();
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
          zIndex: 3000
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 3001,
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
            Convertir PDF a Imagen
          </h2>
          <button
            onClick={handleClose}
            disabled={isConverting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isConverting ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {!pdfInfo ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#6b7280' }}>
              Cargando información del PDF...
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif'
              }}>
                <strong>Archivo:</strong> {pdfInfo.fileName}
                <br />
                <strong>Páginas:</strong> {pdfInfo.numPages}
              </div>
            </div>

            {/* Controles de conversión */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Página:
                </label>
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(Number(e.target.value))}
                  disabled={isConverting}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {Array.from({ length: pdfInfo.numPages }, (_, i) => i + 1).map(page => (
                    <option key={page} value={page}>
                      Página {page}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Escala:
                </label>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  disabled={isConverting}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={1.0}>1.0x (Original)</option>
                  <option value={1.5}>1.5x (Recomendado)</option>
                  <option value={2.0}>2.0x (Alta calidad)</option>
                  <option value={2.5}>2.5x (Muy alta calidad)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Calidad JPEG:
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={isConverting}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={0.6}>0.6 (Comprimido)</option>
                  <option value={0.8}>0.8 (Recomendado)</option>
                  <option value={0.9}>0.9 (Alta calidad)</option>
                  <option value={1.0}>1.0 (Máxima calidad)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  onClick={handleConvertAndSubmit}
                  disabled={isConverting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: isConverting ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isConverting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isConverting ? 'Convirtiendo...' : 'Convertir y Continuar'}
                </button>
              </div>
            </div>

            {/* Barra de progreso */}
            {isConverting && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e9ecef', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${conversionProgress}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  Progreso: {conversionProgress}%
                </div>
              </div>
            )}

            {/* Error */}
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

            {/* Previsualización */}
            {previewUrl && !isConverting && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>
                  Previsualización (Página {selectedPage}):
                </h4>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <img
                    src={previewUrl}
                    alt={`Previsualización página ${selectedPage}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PDFConversionModal; 