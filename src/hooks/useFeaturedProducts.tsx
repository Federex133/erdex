
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFeaturedProducts = () => {
  const { toast } = useToast();

  const updateFeaturedProducts = async () => {
    try {
      // Primero obtener los likes por producto
      const { data: productLikes, error: likesError } = await supabase
        .from('product_likes')
        .select('product_id')
        .order('created_at', { ascending: false });

      if (likesError) throw likesError;

      // Contar likes por producto
      const likesCount: {[key: string]: number} = {};
      productLikes?.forEach(like => {
        likesCount[like.product_id] = (likesCount[like.product_id] || 0) + 1;
      });

      // Obtener todos los productos no-gratuitos con sus ventas actuales
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, sales')
        .eq('status', 'active')
        .eq('is_free', false); // Solo considerar productos de pago para el rendimiento

      if (productsError) throw productsError;

      // Calcular puntuación combinada para cada producto (ventas * 2 + likes)
      const productScores = products?.map(product => ({
        id: product.id,
        score: (product.sales * 2) + (likesCount[product.id] || 0)
      })) || [];

      // Ordenar por puntuación, filtrar los que tienen score > 0 y tomar los top 10
      const topProducts = productScores
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(p => p.id);

      // Primero, quitar el estado destacado por rendimiento de todos los productos que no han pagado para ser destacados
      const { error: unfeaturedError } = await supabase
        .from('products')
        .update({ is_performance_featured: false })
        .eq('is_paid_featured', false); // No tocar productos con pago

      if (unfeaturedError) throw unfeaturedError;

      // Luego, marcar como destacados por rendimiento los productos top
      if (topProducts.length > 0) {
        const { error: featuredError } = await supabase
          .from('products')
          .update({ is_performance_featured: true })
          .in('id', topProducts);

        if (featuredError) throw featuredError;
      }

      console.log(`Updated ${topProducts.length} performance-featured products based on metrics`);
    } catch (error) {
      console.error('Error updating featured products:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los productos destacados",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Ejecutar inmediatamente
    updateFeaturedProducts();

    // Ejecutar cada 30 minutos
    const interval = setInterval(updateFeaturedProducts, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    updateFeaturedProducts,
  };
};
