
-- Agregar columna preview_images a la tabla products
ALTER TABLE public.products 
ADD COLUMN preview_images jsonb DEFAULT '[]'::jsonb;

-- Agregar comentario para documentar la columna
COMMENT ON COLUMN public.products.preview_images IS 'Array of preview image URLs for the product';
