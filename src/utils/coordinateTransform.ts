import { Point } from '../types';

interface TransformMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface Bounds {
  topLeft: { lat: number; lng: number };
  topRight: { lat: number; lng: number };
  bottomLeft: { lat: number; lng: number };
  bottomRight: { lat: number; lng: number };
}

/**
 * Calcula la transformación afín entre dos conjuntos de puntos
 * Usa el método de mínimos cuadrados para encontrar la mejor transformación
 */
export function calculateAffineTransform(imagePoints: Point[], mapPoints: Point[], imageWidth?: number, imageHeight?: number): TransformMatrix {
  if (imagePoints.length < 2 || mapPoints.length < 2) {
    throw new Error('Se necesitan al menos 2 puntos para calcular la transformación');
  }

  // Para 2 puntos, usamos una transformación lineal simple que preserva aspect ratio
  if (imagePoints.length === 2) {
    return calculateLinearTransform(imagePoints, mapPoints, imageWidth, imageHeight);
  }

  // Para 3 o más puntos, usamos transformación afín completa
  return calculateFullAffineTransform(imagePoints, mapPoints);
}

/**
 * Calcula una transformación lineal simple para 2 puntos preservando aspect ratio
 */
function calculateLinearTransform(imagePoints: Point[], mapPoints: Point[], imageWidth?: number, imageHeight?: number): TransformMatrix {
  const [p1, p2] = imagePoints;
  const [m1, m2] = mapPoints;

  console.log('=== CÁLCULO DE TRANSFORMACIÓN LINEAL ===');
  console.log('Puntos de imagen:', { p1, p2 });
  console.log('Puntos de mapa:', { m1, m2 });
  console.log('Dimensiones de imagen:', { imageWidth, imageHeight });

  // Calculamos el ángulo de rotación basado en la dirección de los puntos
  const imageAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const mapAngle = Math.atan2(m2.lat - m1.lat, m2.lng - m1.lng);
  const rotation = mapAngle - imageAngle;
  
  console.log('Ángulos calculados:', { 
    imageAngle: imageAngle * 180 / Math.PI, 
    mapAngle: mapAngle * 180 / Math.PI, 
    rotation: rotation * 180 / Math.PI 
  });

  // Si tenemos las dimensiones de la imagen, calculamos la escala preservando aspect ratio
  if (imageWidth && imageHeight) {
    console.log('Usando dimensiones de imagen para preservar aspect ratio');
    
    // Calculamos la distancia entre los puntos seleccionados
    const mapDist = Math.sqrt((m2.lng - m1.lng) ** 2 + (m2.lat - m1.lat) ** 2);
    
    // Calculamos la distancia entre los puntos de imagen seleccionados
    const imageDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    
    // Calculamos la escala basada en la distancia entre los puntos seleccionados
    const scale = mapDist / imageDist;
    
    console.log('Cálculos de escala:', {
      mapDist,
      imageDist,
      scale
    });
    
    // Matriz de transformación preservando aspect ratio
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const result = {
      a: scale * cos,
      b: -scale * sin,
      c: scale * sin,
      d: scale * cos,
      e: m1.lng - (p1.x * scale * cos - p1.y * scale * sin),
      f: m1.lat - (p1.x * scale * sin + p1.y * scale * cos)
    };
    
    console.log('Matriz de transformación resultante:', result);
    console.log('==========================================');
    
    return result;
  } else {
    console.log('Usando fallback sin dimensiones de imagen');
    
    // Fallback: calculamos la escala basada en la distancia horizontal
    const imageWidthDist = Math.abs(p2.x - p1.x);
    const mapWidthDist = Math.abs(m2.lng - m1.lng);
    
    let scale;
    if (imageWidthDist > 10) {
      scale = mapWidthDist / imageWidthDist;
      console.log('Usando escala horizontal:', { imageWidthDist, mapWidthDist, scale });
    } else {
      const imageHeightDist = Math.abs(p2.y - p1.y);
      const mapHeightDist = Math.abs(m2.lat - m1.lat);
      scale = mapHeightDist / imageHeightDist;
      console.log('Usando escala vertical:', { imageHeightDist, mapHeightDist, scale });
    }

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const result = {
      a: scale * cos,
      b: -scale * sin,
      c: scale * sin,
      d: scale * cos,
      e: m1.lng - (p1.x * scale * cos - p1.y * scale * sin),
      f: m1.lat - (p1.x * scale * sin + p1.y * scale * cos)
    };
    
    console.log('Matriz de transformación resultante (fallback):', result);
    console.log('==========================================');
    
    return result;
  }
}

/**
 * Calcula una transformación afín completa usando mínimos cuadrados
 */
function calculateFullAffineTransform(imagePoints: Point[], mapPoints: Point[]): TransformMatrix {
  // Para 3 puntos, usamos un enfoque más simple y robusto
  if (imagePoints.length === 3) {
    return calculateThreePointTransform(imagePoints, mapPoints);
  }

  // Para 4 puntos, usamos mínimos cuadrados
  const A: number[][] = [];
  const bLat: number[] = [];
  const bLng: number[] = [];

  for (let i = 0; i < imagePoints.length; i++) {
    const img = imagePoints[i];
    const map = mapPoints[i];
    
    A.push([img.x, img.y, 1, 0, 0, 0]);
    A.push([0, 0, 0, img.x, img.y, 1]);
    
    bLng.push(map.lng);
    bLat.push(map.lat);
  }

  // Resolvemos el sistema usando eliminación gaussiana
  const xLng = solveLinearSystem(A, bLng);
  const xLat = solveLinearSystem(A, bLat);

  // Validar que los resultados no sean NaN
  if (xLng.some(isNaN) || xLat.some(isNaN)) {
    throw new Error('No se pudo calcular la transformación. Verifica que los puntos estén bien distribuidos.');
  }

  return {
    a: xLng[0],
    b: xLng[1],
    c: xLat[0],
    d: xLat[1],
    e: xLng[2],
    f: xLat[2]
  };
}

/**
 * Calcula transformación para 3 puntos usando un enfoque más robusto
 */
function calculateThreePointTransform(imagePoints: Point[], mapPoints: Point[]): TransformMatrix {
  const [p1, p2, p3] = imagePoints;
  const [m1, m2, m3] = mapPoints;

  // Usar los dos primeros puntos para calcular escala y rotación
  const imageDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const mapDist = Math.sqrt((m2.lng - m1.lng) ** 2 + (m2.lat - m1.lat) ** 2);
  
  if (imageDist === 0) {
    throw new Error('Los puntos de la imagen están muy cerca entre sí');
  }
  
  const scale = mapDist / imageDist;
  
  // Calcular ángulo de rotación
  const imageAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const mapAngle = Math.atan2(m2.lat - m1.lat, m2.lng - m1.lng);
  const rotation = mapAngle - imageAngle;

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  // Calcular traslación usando el tercer punto
  const predictedLng = p3.x * scale * cos - p3.y * scale * sin + m1.lng - (p1.x * scale * cos - p1.y * scale * sin);
  const predictedLat = p3.x * scale * sin + p3.y * scale * cos + m1.lat - (p1.x * scale * sin + p1.y * scale * cos);
  
  // Ajustar traslación para que el tercer punto coincida mejor
  const offsetLng = m3.lng - predictedLng;
  const offsetLat = m3.lat - predictedLat;
  
  return {
    a: scale * cos,
    b: -scale * sin,
    c: scale * sin,
    d: scale * cos,
    e: m1.lng - (p1.x * scale * cos - p1.y * scale * sin) + offsetLng * 0.5,
    f: m1.lat - (p1.x * scale * sin + p1.y * scale * cos) + offsetLat * 0.5
  };
}

/**
 * Resuelve un sistema de ecuaciones lineales usando eliminación gaussiana
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const m = A[0].length;
  
  // Crear matriz aumentada
  const augmented: number[][] = [];
  for (let i = 0; i < n; i++) {
    augmented[i] = [...A[i], b[i]];
  }

  // Eliminación gaussiana
  for (let i = 0; i < Math.min(n, m); i++) {
    // Buscar el pivote máximo
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Intercambiar filas
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Hacer cero todos los elementos debajo del pivote
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= m; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Sustitución hacia atrás
  const x = new Array(m).fill(0);
  for (let i = Math.min(n, m) - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < m; j++) {
      sum += augmented[i][j] * x[j];
    }
    x[i] = (augmented[i][m] - sum) / augmented[i][i];
  }

  return x;
}

/**
 * Aplica una transformación afín a un punto
 */
export function applyTransform(point: { x: number; y: number }, transform: TransformMatrix): { lat: number; lng: number } {
  const result = {
    lng: transform.a * point.x + transform.b * point.y + transform.e,
    lat: transform.c * point.x + transform.d * point.y + transform.f
  };
  
  console.log('Aplicando transformación:', {
    puntoOriginal: point,
    transformacion: transform,
    resultado: result,
    calculos: {
      lng: `${transform.a} * ${point.x} + ${transform.b} * ${point.y} + ${transform.e} = ${result.lng}`,
      lat: `${transform.c} * ${point.x} + ${transform.d} * ${point.y} + ${transform.f} = ${result.lat}`
    }
  });
  
  return result;
}

/**
 * Calcula los bounds de la imagen transformada
 */
export function calculateImageBounds(
  imageWidth: number, 
  imageHeight: number, 
  transform: TransformMatrix
): Bounds {
  console.log('=== CÁLCULO DE BOUNDS ===');
  console.log('Dimensiones de imagen:', { imageWidth, imageHeight });
  console.log('Transformación:', transform);
  
  const corners = [
    { x: 0, y: 0 },                    // top-left
    { x: imageWidth, y: 0 },           // top-right
    { x: 0, y: imageHeight },          // bottom-left
    { x: imageWidth, y: imageHeight }  // bottom-right
  ];

  console.log('Esquinas originales:', corners);

  const transformedCorners = corners.map(corner => applyTransform(corner, transform));
  
  console.log('Esquinas transformadas:', transformedCorners);

  const result = {
    topLeft: transformedCorners[0],
    topRight: transformedCorners[1],
    bottomLeft: transformedCorners[2],
    bottomRight: transformedCorners[3]
  };
  
  console.log('Bounds resultantes:', result);
  console.log('========================');
  
  return result;
}

/**
 * Calcula el centro de la imagen transformada
 */
export function calculateImageCenter(
  imageWidth: number, 
  imageHeight: number, 
  transform: TransformMatrix
): { lat: number; lng: number } {
  console.log('=== CÁLCULO DE CENTRO ===');
  console.log('Dimensiones de imagen:', { imageWidth, imageHeight });
  
  const center = { x: imageWidth / 2, y: imageHeight / 2 };
  console.log('Centro original:', center);
  
  const result = applyTransform(center, transform);
  console.log('Centro transformado:', result);
  console.log('=======================');
  
  return result;
}

/**
 * Valida que los puntos de referencia sean válidos
 */
export function validateReferencePoints(imagePoints: Point[], mapPoints: Point[]): boolean {
  if (imagePoints.length !== mapPoints.length) {
    console.log('Número de puntos diferente:', imagePoints.length, mapPoints.length);
    return false;
  }

  if (imagePoints.length < 2 || imagePoints.length > 4) {
    console.log('Número de puntos inválido:', imagePoints.length);
    return false;
  }

  // Verificar que los puntos no estén muy cerca entre sí
  for (let i = 0; i < imagePoints.length; i++) {
    for (let j = i + 1; j < imagePoints.length; j++) {
      const imgDist = Math.sqrt(
        (imagePoints[i].x - imagePoints[j].x) ** 2 + 
        (imagePoints[i].y - imagePoints[j].y) ** 2
      );
      
      const mapDist = Math.sqrt(
        (mapPoints[i].lng - mapPoints[j].lng) ** 2 + 
        (mapPoints[i].lat - mapPoints[j].lat) ** 2
      );

      if (imgDist < 20) {
        console.log('Puntos de imagen muy cerca:', imgDist);
        return false;
      }
      
      if (mapDist < 0.0001) {
        console.log('Puntos de mapa muy cerca:', mapDist);
        return false;
      }
    }
  }

  // Verificar que no haya valores NaN
  for (const point of [...imagePoints, ...mapPoints]) {
    if (isNaN(point.x) || isNaN(point.y) || isNaN(point.lat) || isNaN(point.lng)) {
      console.log('Punto con valores NaN:', point);
      return false;
    }
  }

  return true;
} 