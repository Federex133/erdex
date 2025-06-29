
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Product } from './useProducts';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products: Product | null;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  cartCount: number;
  isProductInCart: (productId: string) => boolean;
  clearCart: () => Promise<void>;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`id, product_id, created_at, products (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).filter(item => item.products).map(item => ({
        ...item,
        products: {
            ...item.products!,
            is_featured: item.products!.is_paid_featured || item.products!.is_performance_featured,
        }
      })) as CartItem[];

      setCartItems(transformedData);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos del carrito",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user, fetchCartItems]);
  
  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para añadir productos al carrito.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isProductInCart(productId)) {
        toast({ title: "Producto ya en el carrito" });
        return;
      }
      
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: productId })
        .select(`id, product_id, created_at, products (*)`)
        .single();
        
      if (error) throw error;
      
      const newItem = {
        ...data,
        products: {
            ...data.products!,
            is_featured: data.products!.is_paid_featured || data.products!.is_performance_featured,
        }
      } as CartItem;

      setCartItems(prev => [newItem, ...prev]);
      toast({
        title: "¡Añadido al carrito!",
        description: "El producto se ha añadido a tu carrito.",
      });
    } catch (error: any) {
        console.error('Error adding to cart:', error);
        if (error.code === '23505') { // unique_violation
             toast({
                title: "Producto ya en el carrito",
             });
        } else {
            toast({
                title: "Error",
                description: "No se pudo añadir el producto al carrito.",
                variant: "destructive",
            });
        }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
        
      if (error) throw error;
      
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      toast({
        title: "Eliminado del carrito",
      });
    } catch (error) {
        console.error('Error removing from cart:', error);
        toast({
            title: "Error",
            description: "No se pudo eliminar el producto del carrito.",
            variant: "destructive",
        });
    }
  };
  
  const clearCart = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "No se pudo vaciar el carrito.",
        variant: "destructive",
      });
    }
  };

  const isProductInCart = (productId: string) => {
    return cartItems.some(item => item.product_id === productId);
  };
  
  const total = cartItems.reduce((sum, item) => sum + (item.products?.price || 0), 0);

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    cartCount: cartItems.length,
    isProductInCart,
    clearCart,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

