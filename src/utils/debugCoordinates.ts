// Utilidad para debug de coordenadas
export function debugCoordinateTransform(
  clickX: number,
  clickY: number,
  imagePan: { x: number; y: number },
  imageZoom: number,
  imgWidth: number,
  imgHeight: number
) {
  // Convertir coordenadas del clic a coordenadas de la imagen
  const imageX = (clickX - imagePan.x) / imageZoom;
  const imageY = (clickY - imagePan.y) / imageZoom;
  
  // Verificar límites
  const isWithinBounds = imageX >= 0 && imageY >= 0 && imageX <= imgWidth && imageY <= imgHeight;
  
  console.log('Debug de coordenadas:', {
    clickX,
    clickY,
    imagePan,
    imageZoom,
    imageX,
    imageY,
    imgWidth,
    imgHeight,
    isWithinBounds
  });
  
  return {
    imageX,
    imageY,
    isWithinBounds
  };
}

// Función para simular diferentes escenarios de zoom y pan
export function testCoordinateScenarios() {
  console.log('=== Pruebas de transformación de coordenadas ===');
  
  // Escenario 1: Sin zoom ni pan
  console.log('\n1. Sin zoom ni pan:');
  debugCoordinateTransform(100, 100, { x: 0, y: 0 }, 1, 800, 600);
  
  // Escenario 2: Con zoom
  console.log('\n2. Con zoom 2x:');
  debugCoordinateTransform(200, 200, { x: 0, y: 0 }, 2, 800, 600);
  
  // Escenario 3: Con pan
  console.log('\n3. Con pan (50, 50):');
  debugCoordinateTransform(150, 150, { x: 50, y: 50 }, 1, 800, 600);
  
  // Escenario 4: Con zoom y pan
  console.log('\n4. Con zoom 1.5x y pan (30, 20):');
  debugCoordinateTransform(180, 160, { x: 30, y: 20 }, 1.5, 800, 600);
  
  // Escenario 5: Fuera de límites
  console.log('\n5. Fuera de límites:');
  debugCoordinateTransform(900, 700, { x: 0, y: 0 }, 1, 800, 600);
} 