
-- Crear políticas RLS para que los admins puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Crear función para verificar si un usuario está baneado
CREATE OR REPLACE FUNCTION public.check_user_ban_status(user_id uuid)
RETURNS TABLE(is_banned boolean, reason text, banned_until timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN ub.is_permanent = true OR (ub.banned_until IS NOT NULL AND ub.banned_until > now()) 
      THEN true 
      ELSE false 
    END as is_banned,
    ub.reason,
    ub.banned_until
  FROM public.user_bans ub
  WHERE ub.user_id = check_user_ban_status.user_id
  ORDER BY ub.created_at DESC
  LIMIT 1;
$$;
