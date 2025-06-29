
-- Create a table for user follows
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a user can't follow the same person twice
  UNIQUE(follower_id, following_id),
  
  -- Ensure a user can't follow themselves
  CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Allow users to view all follows (public information)
CREATE POLICY "Users can view all follows" 
  ON public.user_follows 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow users to create follows for themselves
CREATE POLICY "Users can follow others" 
  ON public.user_follows 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = follower_id);

-- Allow users to unfollow (delete their own follows)
CREATE POLICY "Users can unfollow others" 
  ON public.user_follows 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = follower_id);

-- Add indexes for better performance
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- Add columns to profiles table for follower/following counts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();
