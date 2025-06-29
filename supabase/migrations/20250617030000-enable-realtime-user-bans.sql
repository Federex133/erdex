-- Enable realtime for user_bans table
ALTER TABLE public.user_bans REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bans;

-- Ensure proper RLS policies for user_bans
CREATE POLICY IF NOT EXISTS "Admins can manage all bans"
ON public.user_bans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow users to see their own ban status
CREATE POLICY IF NOT EXISTS "Users can view their own ban status"
ON public.user_bans
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to create bans
CREATE POLICY IF NOT EXISTS "Admins can create bans"
ON public.user_bans
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete bans (unban)
CREATE POLICY IF NOT EXISTS "Admins can delete bans"
ON public.user_bans
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
); 