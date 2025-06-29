
-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view all public profiles (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all public profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view all public profiles" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated 
    USING (true)';
  END IF;
END $$;
