# 🚀 Quick Start - Map Overlay

## ⚡ Inicio Rápido (5 minutos)

### 1. Configurar Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Ejecuta el script SQL en `supabase-setup.sql` en el SQL Editor
3. Crea un bucket de storage llamado `overlay-images`
4. Copia tu URL y anon key

### 2. Configurar Variables de Entorno
```bash
cp env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase
```

### 3. Instalar y Ejecutar
```bash
npm install
npm start
```

¡Listo! La app estará en `http://localhost:3000`

## 📱 Para Android

```bash
npm run cap:build:android
# Se abrirá Android Studio automáticamente
```

## 🌐 Para PWA

```bash
npm run build
npm run serve
# Instala como PWA desde el navegador
```

## 🎯 Funcionalidades Principales

✅ **Mapa interactivo** con OpenStreetMap  
✅ **Subir imágenes/PDFs** como superposiciones  
✅ **Ajustar transparencia, escala y rotación**  
✅ **GPS en tiempo real** con indicador de ubicación  
✅ **Brújula digital** con orientación del dispositivo  
✅ **Sincronización automática** con Supabase  
✅ **PWA completa** - instálala como app nativa  

## 🛠️ Comandos Útiles

```bash
npm start          # Desarrollo local
npm run build      # Construir para producción
npm run cap:sync   # Sincronizar con Capacitor
npm run serve      # Servir build local
```

## 🆘 Problemas Comunes

**Error de Supabase**: Verifica que las variables de entorno estén configuradas  
**GPS no funciona**: Asegúrate de dar permisos de ubicación  
**No se cargan imágenes**: Verifica las políticas del bucket de storage  

---

**¡Disfruta superponiendo cualquier plano sobre cualquier mapa! 🗺️** 