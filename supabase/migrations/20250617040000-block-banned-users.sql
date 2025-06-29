-- Policy para bloquear acceso a usuarios baneados en la tabla profiles
CREATE POLICY "No acceso si baneado"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  NOT (public.check_user_ban_status(auth.uid())::record).is_banned
  OR public.has_role(auth.uid(), 'admin')
); 