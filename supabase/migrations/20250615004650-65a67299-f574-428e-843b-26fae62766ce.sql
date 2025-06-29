
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN background_url text,
ADD COLUMN presentation_video_url text;

-- Create storage bucket for profile media
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true);

-- Create storage policies for profile media bucket
CREATE POLICY "Users can upload their own profile media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all profile media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-media');

CREATE POLICY "Users can update their own profile media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);
