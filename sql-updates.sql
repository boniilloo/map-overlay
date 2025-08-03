-- Configuración mínima para carga de mapas
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear bucket overlay-images manualmente en Storage

-- 2. Políticas básicas de storage
DROP POLICY IF EXISTS "Users can upload overlay images" ON storage.objects;
DROP POLICY IF EXISTS "Overlay images are publicly readable" ON storage.objects;

CREATE POLICY "Users can upload overlay images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'overlay-images');

CREATE POLICY "Overlay images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'overlay-images');

-- 3. Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferences JSONB DEFAULT '{"defaultMapType": "osm", "defaultOpacity": 0.7, "autoSave": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Asegurar que la tabla overlays existe con los campos básicos
-- Si la tabla no existe, créala
CREATE TABLE IF NOT EXISTS overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  opacity DECIMAL(3,2) DEFAULT 0.7,
  scale DECIMAL(5,2) DEFAULT 1.00,
  rotation INTEGER DEFAULT 0,
  position JSONB DEFAULT '{"lat": 0, "lng": 0}',
  anchor_points JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Añadir columna anchor_points si no existe (para tablas existentes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'overlays' AND column_name = 'anchor_points'
  ) THEN
    ALTER TABLE overlays ADD COLUMN anchor_points JSONB DEFAULT NULL;
  END IF;
END $$;

-- 6. Índices básicos
CREATE INDEX IF NOT EXISTS idx_overlays_user_id ON overlays(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 7. Habilitar RLS y crear políticas para las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para la tabla overlays
CREATE POLICY "Users can view their own overlays" ON overlays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own overlays" ON overlays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own overlays" ON overlays
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own overlays" ON overlays
  FOR DELETE USING (auth.uid() = user_id); 