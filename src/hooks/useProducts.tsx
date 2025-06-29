
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFeaturedProducts } from './useFeaturedProducts';

export interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  paypal_email?: string;
  is_free: boolean;
  is_paid_featured: boolean;
  is_performance_featured: boolean;
  is_featured: boolean; // Derived on the client
  status: string;
  sales: number;
  rating: number;
  views: number;
  file_url?: string;
  image_url?: string;
  preview_images?: string[];
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateFeaturedProducts } = useFeaturedProducts();

  // Cargar todos los productos
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
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
      
      // Ordenar productos: destacados primero, luego por fecha
      const sortedProducts = transformedData.sort((a, b) => {
        // Primero los destacados
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        
        // Si ambos son destacados o ninguno es destacado, ordenar por fecha
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo producto
  const createProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'sales' | 'rating' | 'views' | 'created_at' | 'updated_at' | 'is_paid_featured' | 'is_performance_featured' | 'is_featured'> & { is_featured?: boolean }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear productos",
        variant: "destructive",
      });
      return { error: new Error('User not authenticated') };
    }

    try {
      console.log('Creating product with data:', productData);
      
      const { is_featured, ...restOfProductData } = productData;
      
      // Ensure preview_images is properly formatted and featured status is set correctly
      const formattedData = {
        ...restOfProductData,
        user_id: user!.id,
        preview_images: productData.preview_images || [],
        // Only set as paid featured if explicitly true (payment confirmed)
        is_paid_featured: is_featured === true,
        is_performance_featured: false
      };

      console.log('Formatted data for insert:', formattedData);

      const { data, error } = await supabase
        .from('products')
        .insert([formattedData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Product created successfully:', data);

      // Transformar los datos del producto creado
      const transformedProduct = {
        ...data,
        is_featured: data.is_paid_featured || data.is_performance_featured,
        preview_images: Array.isArray(data.preview_images) 
          ? data.preview_images.filter((img): img is string => typeof img === 'string')
          : []
      };

      // Actualizar lista local ordenando correctamente
      setProducts(prev => {
        const newProducts = [transformedProduct, ...prev];
        return newProducts.sort((a, b) => {
          // Primero los destacados
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          
          // Si ambos son destacados o ninguno es destacado, ordenar por fecha
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });

      // Actualizar productos destacados después de crear uno nuevo
      setTimeout(() => {
        updateFeaturedProducts();
      }, 1000);

      // Show appropriate success message
      const successMessage = data.is_paid_featured 
        ? "Tu producto ha sido publicado y destacado exitosamente" 
        : "Tu producto ha sido publicado exitosamente";

      toast({
        title: "¡Producto publicado!",
        description: successMessage,
      });

      return { data: transformedProduct, error: null };
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el producto. Intenta de nuevo.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    createProduct,
    refreshProducts: fetchProducts,
  };
};

