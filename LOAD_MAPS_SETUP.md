# Configuración para la funcionalidad de carga de mapas

## Pasos necesarios para activar la funcionalidad:

### 1. Crear el bucket de storage en Supabase

1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**
4. Nombre del bucket: `overlay-images`
5. Marca la opción **Public bucket** para permitir acceso público a las imágenes
6. Haz clic en **Create bucket**

### 2. Ejecutar el script SQL

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido del archivo `sql-updates.sql`
3. Haz clic en **Run** para ejecutar el script

### 3. Verificar las políticas de storage

El script SQL creará automáticamente las políticas necesarias para:
- Permitir que los usuarios autenticados suban archivos
- Permitir lectura pública de las imágenes
- Permitir que los usuarios actualicen sus propias imágenes
- Permitir que los usuarios eliminen sus propias imágenes

### 4. Funcionalidad implementada

Una vez configurado, podrás:

1. **Abrir la sidebar** haciendo clic en el botón de menú
2. **Expandir "My Maps"** haciendo clic en la sección
3. **Hacer clic en "Load Map"** para abrir el modal de carga
4. **Seleccionar un archivo** (PDF, JPG, PNG, TIFF) de máximo 10MB
5. **Especificar un nombre** para el mapa
6. **Cargar el mapa** - se guardará en la base de datos y aparecerá en la lista

### 5. Formatos soportados

- **PDF** (.pdf)
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **TIFF** (.tiff, .tif)

### 6. Límites

- **Tamaño máximo**: 10MB por archivo
- **Almacenamiento**: Los archivos se guardan en Supabase Storage
- **Organización**: Cada usuario tiene su propia carpeta con sus mapas

### 7. Solución de problemas

Si encuentras errores:

1. **Verifica que el bucket `overlay-images` existe** en Storage
2. **Asegúrate de que las políticas de storage están configuradas** correctamente
3. **Comprueba que el usuario está autenticado** antes de intentar cargar
4. **Verifica el tamaño del archivo** (máximo 10MB)
5. **Comprueba el formato del archivo** (solo PDF, JPG, PNG, TIFF)

### 8. Próximos pasos

Esta funcionalidad es la base para:
- Visualizar los mapas cargados en el mapa principal
- Editar la posición y propiedades de los mapas
- Compartir mapas entre usuarios
- Organizar mapas en categorías 