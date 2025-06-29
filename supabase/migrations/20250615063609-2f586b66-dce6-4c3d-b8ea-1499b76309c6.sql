
-- Agregar la columna is_admin a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
