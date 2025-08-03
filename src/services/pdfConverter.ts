import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de pdf.js para usar el archivo local
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface PDFConversionOptions {
  scale?: number;
  pageNumber?: number;
  quality?: number;
}

export class PDFConverter {
  /**
   * Convierte un PDF a una imagen (blob)
   */
  static async convertPDFToImage(
    file: File, 
    options: PDFConversionOptions = {}
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const {
      scale = 1.5,
      pageNumber = 1,
      quality = 0.8
    } = options;

    try {
      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Cargar el PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Verificar que la página existe
      if (pageNumber > pdf.numPages) {
        throw new Error(`La página ${pageNumber} no existe. El PDF tiene ${pdf.numPages} páginas.`);
      }
      
      // Obtener la página
      const page = await pdf.getPage(pageNumber);
      
      // Calcular dimensiones
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }
      
      // Configurar canvas
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Renderizar la página
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Convertir canvas a blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width: viewport.width,
                height: viewport.height
              });
            } else {
              reject(new Error('No se pudo convertir el canvas a imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      });
      
    } catch (error) {
      console.error('Error convirtiendo PDF a imagen:', error);
      throw new Error(`Error al convertir PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Convierte un PDF a URL de imagen
   */
  static async convertPDFToImageURL(
    file: File, 
    options: PDFConversionOptions = {}
  ): Promise<{ url: string; width: number; height: number }> {
    const { blob, width, height } = await this.convertPDFToImage(file, options);
    const url = URL.createObjectURL(blob);
    
    return { url, width, height };
  }

  /**
   * Verifica si un archivo es un PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Obtiene información básica del PDF (número de páginas, etc.)
   */
  static async getPDFInfo(file: File): Promise<{ numPages: number; fileName: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return {
        numPages: pdf.numPages,
        fileName: file.name
      };
    } catch (error) {
      console.error('Error obteniendo información del PDF:', error);
      throw new Error(`Error al leer PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Limpia las URLs de objetos creadas
   */
  static revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
} 