
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Product } from './useProducts';

export const useMyProducts = () => {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar productos del usuario
  const fetchMyProducts = async () => {
    if (!user) {
      setMyProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar los datos para asegurar que preview_images sea string[] y derivar is_featured
      const transformedData = (data || []).map(product => ({
        ...product,
        is_featured: product.is_paid_featured || product.is_performance_featured,
        preview_images: Array.isArray(product.preview_images) 
          ? product.preview_images.filter((img): img is string => typeof img === 'string')
          : []
      }));
      
      setMyProducts(transformedData);
    } catch (error) {
      console.error('Error fetching my products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const deleteProduct = async (productId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para eliminar productos",
        variant: "destructive",
      });
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Actualizar lista local removiendo el producto eliminado
      setMyProducts(prev => prev.filter(product => product.id !== productId));

      toast({
        title: "¡Producto eliminado!",
        description: "Tu producto ha sido eliminado exitosamente",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  return {
    myProducts,
    loading,
    deleteProduct,
    refreshMyProducts: fetchMyProducts,
  };
};
