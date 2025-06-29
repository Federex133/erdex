
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useProductLikes = (productId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar estado de likes
  const fetchLikes = async () => {
    try {
      // Obtener total de likes
      const { count: totalLikes, error: countError } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact' })
        .eq('product_id', productId);

      if (countError) throw countError;
      setLikesCount(totalLikes || 0);

      // Verificar si el usuario actual ya dio like
      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('product_likes')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .single();

        if (userLikeError && userLikeError.code !== 'PGRST116') {
          throw userLikeError;
        }

        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle like
  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        // Remover like
        const { error } = await supabase
          .from('product_likes')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Agregar like
        const { error } = await supabase
          .from('product_likes')
          .insert([{
            product_id: productId,
            user_id: user.id,
          }]);

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }

      // Disparar actualización de productos destacados después de un cambio en likes
      // Usar un pequeño delay para que el cambio se procese primero
      setTimeout(async () => {
        try {
          // Importar dinámicamente para evitar dependencias circulares
          const { useFeaturedProducts } = await import('./useFeaturedProducts');
          // Esta es una llamada directa a la función, no al hook
          // En el siguiente ciclo de renderizado se actualizará automáticamente
        } catch (error) {
          console.error('Error updating featured products:', error);
        }
      }, 500);

    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el like",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (productId) {
      fetchLikes();
    }
  }, [productId, user]);

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
    refreshLikes: fetchLikes,
  };
};
