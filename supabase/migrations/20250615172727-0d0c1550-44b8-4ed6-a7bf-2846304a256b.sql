
-- Create a table for cart items
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_user_product_uc UNIQUE (user_id, product_id)
);

-- Add Row Level Security (RLS) to ensure users can only manage their own cart
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing own cart items
CREATE POLICY "Users can view their own cart items"
  ON public.cart_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for adding items to own cart
CREATE POLICY "Users can add items to their own cart"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for removing items from own cart
CREATE POLICY "Users can remove items from their own cart"
  ON public.cart_items
  FOR DELETE
  USING (auth.uid() = user_id);
