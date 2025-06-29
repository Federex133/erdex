
-- Create table to store 2FA settings for users
CREATE TABLE public.user_2fa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_email TEXT NOT NULL,
  secret_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for 2FA settings
CREATE POLICY "Users can view their own 2FA settings" 
  ON public.user_2fa_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own 2FA settings" 
  ON public.user_2fa_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" 
  ON public.user_2fa_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create table to store 2FA verification codes
CREATE TABLE public.user_2fa_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for 2FA codes
CREATE POLICY "Users can view their own 2FA codes" 
  ON public.user_2fa_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own 2FA codes" 
  ON public.user_2fa_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA codes" 
  ON public.user_2fa_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on 2fa_settings
CREATE TRIGGER handle_updated_at_2fa_settings
  BEFORE UPDATE ON public.user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
