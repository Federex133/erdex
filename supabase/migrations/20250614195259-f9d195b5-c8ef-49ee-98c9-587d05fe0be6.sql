
-- Agregar las columnas faltantes a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN description TEXT,
ADD COLUMN phone TEXT;
