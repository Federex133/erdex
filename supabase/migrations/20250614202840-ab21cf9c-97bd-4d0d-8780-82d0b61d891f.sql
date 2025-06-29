
-- Crear tabla de roles de usuario (solo si no existe)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Crear tabla de usuarios baneados (solo si no existe)
CREATE TABLE IF NOT EXISTS public.user_bans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text,
    banned_until timestamp with time zone,
    is_permanent boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para user_bans
DROP POLICY IF EXISTS "Admins can view all bans" ON public.user_bans;
CREATE POLICY "Admins can view all bans"
ON public.user_bans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage bans" ON public.user_bans;
CREATE POLICY "Admins can manage bans"
ON public.user_bans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Asignar rol de admin a tu cuenta específica
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mr.federex@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger para actualizar updated_at en user_bans
DROP TRIGGER IF EXISTS handle_updated_at_user_bans ON public.user_bans;
CREATE TRIGGER handle_updated_at_user_bans
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
