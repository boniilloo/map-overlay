# Funcionalidad de Ajuste por Puntos de Referencia

## Descripción

Esta nueva funcionalidad permite ajustar la posición y orientación de un mapa superpuesto seleccionando puntos de referencia tanto en la imagen del mapa como en el mapa base. El sistema utiliza transformaciones afines para calcular la posición exacta del mapa superpuesto.

## Características

- **Selección de 2-4 puntos de referencia**: Cuantos más puntos se seleccionen, más preciso será el ajuste
- **Interfaz intuitiva**: Modal paso a paso que guía al usuario
- **Validación de puntos**: Verifica que los puntos estén bien separados
- **Transformación automática**: Calcula automáticamente la posición y orientación correcta
- **Integración completa**: Se integra con el sistema de edición existente

## Cómo usar

### 1. Entrar en modo de edición
- Selecciona un mapa desde la sidebar
- Haz clic en "Editar" para entrar en modo de edición

### 2. Activar el ajuste por puntos
- En la barra de controles de edición, haz clic en el botón "📍 Ajustar por puntos"

### 3. Seleccionar número de puntos
- Elige entre 2, 3 o 4 puntos de referencia
- Cuantos más puntos selecciones, más preciso será el ajuste

### 4. Seleccionar puntos en la imagen
- Haz clic en los puntos de referencia en la imagen del mapa
- Los puntos se marcarán con colores diferentes (rojo, verde, azul, amarillo)
- Puedes eliminar puntos haciendo clic en ellos

### 5. Seleccionar puntos en el mapa
- Haz clic en los mismos puntos de referencia en el mapa base
- Los puntos se marcarán con los mismos colores
- Asegúrate de seleccionar los puntos en el mismo orden que en la imagen

### 6. Aplicar el ajuste
- Haz clic en "Ajustar Mapa" para aplicar la transformación
- El mapa se reposicionará automáticamente

## Implementación Técnica

### Componentes

- **ReferencePointsModal**: Modal principal para la selección de puntos
- **MapClickHandler**: Componente interno para manejar clics en el mapa
- **coordinateTransform**: Utilidades para cálculos matemáticos

### Algoritmos

#### Transformación Afín
El sistema utiliza transformaciones afines para mapear coordenadas de píxeles a coordenadas geográficas:

```
x' = a*x + b*y + e
y' = c*x + d*y + f
```

Donde:
- `(x,y)` son las coordenadas de píxeles en la imagen
- `(x',y')` son las coordenadas geográficas (latitud, longitud)
- `a,b,c,d,e,f` son los parámetros de la transformación

#### Cálculo de Parámetros
Para 2 puntos: Transformación lineal simple (escala y rotación)
Para 3-4 puntos: Transformación afín completa usando mínimos cuadrados

### Validación

El sistema valida que:
- Los puntos estén bien separados (mínimo 10 píxeles en imagen, 0.0001 grados en mapa)
- Se seleccionen entre 2 y 4 puntos
- Los puntos de imagen y mapa coincidan en número

## Archivos Modificados

### Nuevos Archivos
- `src/components/ReferencePointsModal.tsx`: Modal principal
- `src/utils/coordinateTransform.ts`: Utilidades de transformación
- `src/utils/testTransform.ts`: Script de pruebas

### Archivos Modificados
- `src/components/Map.tsx`: Agregado botón de puntos de referencia
- `src/App.tsx`: Integración del modal y manejo de eventos
- `src/types/index.ts`: Agregada interfaz Point

## Pruebas

Para ejecutar las pruebas de transformación:

```javascript
import { testCoordinateTransform } from './utils/testTransform';
testCoordinateTransform();
```

## Limitaciones

- Las dimensiones de la imagen se obtienen al cargar la imagen
- Si la imagen falla al cargar, se usan dimensiones por defecto (1000x1000)
- La precisión depende de la calidad de los puntos seleccionados

## Futuras Mejoras

- [ ] Interfaz para ajustar manualmente los puntos
- [ ] Vista previa de la transformación antes de aplicar
- [ ] Guardado de transformaciones para reutilización
- [ ] Soporte para más tipos de transformaciones
- [ ] Validación visual de la calidad del ajuste 