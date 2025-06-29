-- Bloquear acceso a usuarios baneados en todas las tablas importantes
-- Ejecuta este SQL en el SQL Editor de Supabase

-- Policy para bloquear acceso a usuarios baneados en la tabla profiles
DROP POLICY IF EXISTS "No acceso si baneado" ON public.profiles;
CREATE POLICY "No acceso si baneado"
ON public.profiles
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy para bloquear acceso a usuarios baneados en la tabla products
DROP POLICY IF EXISTS "No acceso si baneado" ON public.products;
CREATE POLICY "No acceso si baneado"
ON public.products
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy para bloquear acceso a usuarios baneados en la tabla messages
DROP POLICY IF EXISTS "No acceso si baneado" ON public.messages;
CREATE POLICY "No acceso si baneado"
ON public.messages
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy para bloquear acceso a usuarios baneados en la tabla conversations
DROP POLICY IF EXISTS "No acceso si baneado" ON public.conversations;
CREATE POLICY "No acceso si baneado"
ON public.conversations
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy para bloquear acceso a usuarios baneados en la tabla cart_items
DROP POLICY IF EXISTS "No acceso si baneado" ON public.cart_items;
CREATE POLICY "No acceso si baneado"
ON public.cart_items
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy para bloquear acceso a usuarios baneados en la tabla user_follows
DROP POLICY IF EXISTS "No acceso si baneado" ON public.user_follows;
CREATE POLICY "No acceso si baneado"
ON public.user_follows
FOR ALL
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
);

-- Habilitar RLS en todas las tablas si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY; 