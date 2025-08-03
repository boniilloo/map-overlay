import L from "leaflet";

export type ImgPt = { x: number; y: number };
export type LatLng = { lat: number; lng: number };
export type MetersPt = { x: number; y: number };

export type Similarity = {
  s: number;      // metros por pixel
  cosT: number;
  sinT: number;
  tx: number;     // traslación en metros (este/oeste)
  ty: number;     // traslación en metros (norte/sur)
};

export function projectLatLngToMeters(map: L.Map, ll: LatLng): MetersPt {
  if (!map.options.crs) {
    throw new Error('Map CRS is not defined');
  }
  const p = map.options.crs.project(L.latLng(ll.lat, ll.lng)); // EPSG:3857
  return { x: p.x, y: p.y };
}

export function unprojectMetersToLatLng(map: L.Map, p: MetersPt): LatLng {
  if (!map.options.crs) {
    throw new Error('Map CRS is not defined');
  }
  const ll = map.options.crs.unproject(L.point(p.x, p.y));
  return { lat: ll.lat, lng: ll.lng };
}

/**
 * Calcula la transformación de semejanza (s, R, t) que mapea dos puntos de imagen -> dos puntos de mapa.
 * imageSize: necesario para invertir el eje Y (y_up = H - y).
 */
export function fitSimilarityFromTwoPairs(
  map: L.Map,
  imgP1: ImgPt,
  imgP2: ImgPt,
  mapLL1: LatLng,
  mapLL2: LatLng,
  imageSize: { width: number; height: number }
): Similarity {
  console.log('=== CÁLCULO DE SEMEJANZA CORREGIDO ===');
  console.log('Puntos de imagen originales:', { imgP1, imgP2 });
  console.log('Puntos de mapa originales:', { mapLL1, mapLL2 });
  console.log('Dimensiones de imagen:', imageSize);

  // 1) Preparar puntos (Y invertida)
  const i1 = { x: imgP1.x, y: imageSize.height - imgP1.y };
  const i2 = { x: imgP2.x, y: imageSize.height - imgP2.y };

  console.log('Puntos de imagen con Y invertida:', { i1, i2 });

  // 2) Pasar mapa a metros
  const m1 = projectLatLngToMeters(map, mapLL1);
  const m2 = projectLatLngToMeters(map, mapLL2);

  console.log('Puntos de mapa en metros:', { m1, m2 });

  // 3) Vectores
  const vImg = { x: i2.x - i1.x, y: i2.y - i1.y };  // px
  const vMap = { x: m2.x - m1.x, y: m2.y - m1.y };  // m

  const lenImg = Math.hypot(vImg.x, vImg.y);
  const lenMap = Math.hypot(vMap.x, vMap.y);
  
  console.log('Vectores y longitudes:', {
    vImg,
    vMap,
    lenImg,
    lenMap
  });

  if (lenImg === 0 || lenMap === 0) throw new Error("Puntos coincidentes");

  // 4) Escala + rotación
  const s = lenMap / lenImg;
  const angImg = Math.atan2(vImg.y, vImg.x);
  const angMap = Math.atan2(vMap.y, vMap.x);
  const theta = angMap - angImg;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  console.log('Cálculos de escala y rotación:', {
    s,
    angImg: angImg * 180 / Math.PI,
    angMap: angMap * 180 / Math.PI,
    theta: theta * 180 / Math.PI,
    cosT,
    sinT
  });

  // 5) Traslación
  const X1m = s * (cosT * i1.x - sinT * i1.y);
  const Y1m = s * (sinT * i1.x + cosT * i1.y);
  const tx = m1.x - X1m;
  const ty = m1.y - Y1m;

  console.log('Cálculos de traslación:', {
    X1m,
    Y1m,
    tx,
    ty
  });

  const result = { s, cosT, sinT, tx, ty };
  console.log('Transformación de semejanza resultante:', result);
  console.log('==========================================');

  return result;
}

/** Aplica la semejanza a un punto de imagen (px) → metros EPSG:3857 */
export function imgToMeters(
  T: Similarity,
  pt: ImgPt,
  imageSize: { width: number; height: number }
): MetersPt {
  const y_up = imageSize.height - pt.y;
  const Xm = T.s * (T.cosT * pt.x - T.sinT * y_up) + T.tx;
  const Ym = T.s * (T.sinT * pt.x + T.cosT * y_up) + T.ty;
  
  console.log('Transformando punto de imagen a metros:', {
    puntoOriginal: pt,
    y_invertida: y_up,
    resultado: { x: Xm, y: Ym }
  });
  
  return { x: Xm, y: Ym };
}

export function computeOverlayCorners(
  map: L.Map,
  T: Similarity,
  imageSize: { width: number; height: number }
) {
  console.log('=== CÁLCULO DE ESQUINAS DE OVERLAY ===');
  console.log('Transformación:', T);
  console.log('Dimensiones:', imageSize);

  const W = imageSize.width;
  const H = imageSize.height;

  const TLm = imgToMeters(T, { x: 0,  y: 0  }, imageSize);
  const TRm = imgToMeters(T, { x: W,  y: 0  }, imageSize);
  const BLm = imgToMeters(T, { x: 0,  y: H  }, imageSize);
  const BRm = imgToMeters(T, { x: W,  y: H  }, imageSize);

  console.log('Esquinas en metros:', { TLm, TRm, BLm, BRm });

  const TL = unprojectMetersToLatLng(map, TLm);
  const TR = unprojectMetersToLatLng(map, TRm);
  const BL = unprojectMetersToLatLng(map, BLm);
  const BR = unprojectMetersToLatLng(map, BRm);

  console.log('Esquinas en lat/lng:', { TL, TR, BL, BR });
  console.log('=====================================');

  return { TL, TR, BL, BR };
} 