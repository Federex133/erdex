
-- Renombrar la columna existente para aclarar que es para destacar por rendimiento
ALTER TABLE public.products RENAME COLUMN is_featured TO is_performance_featured;

-- Añadir una nueva columna para gestionar los productos destacados por pago
ALTER TABLE public.products ADD COLUMN is_paid_featured BOOLEAN NOT NULL DEFAULT FALSE;
