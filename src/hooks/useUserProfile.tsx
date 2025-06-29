
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from './useProducts';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  description?: string;
  background_url?: string;
  presentation_video_url?: string;
  created_at: string;
  followers_count?: number;
  following_count?: number;
}

interface UserStats {
  totalSales: number;
  totalProducts: number;
  totalLikes: number;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalSales: 0,
    totalProducts: 0,
    totalLikes: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      // Obtener perfil del usuario con contadores actualizados
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Obtener productos públicos del usuario
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Transformar productos
      const transformedProducts = (productsData || []).map(product => ({
        ...product,
        is_featured: product.is_paid_featured || product.is_performance_featured,
        preview_images: Array.isArray(product.preview_images) 
          ? product.preview_images.filter((img): img is string => typeof img === 'string')
          : []
      }));

      // Calcular estadísticas
      const totalSales = transformedProducts.reduce((acc, product) => acc + product.sales, 0);
      const totalProducts = transformedProducts.length;

      // Obtener total de likes de todos los productos del usuario
      const { data: likesData, error: likesError } = await supabase
        .from('product_likes')
        .select('product_id')
        .in('product_id', transformedProducts.map(p => p.id));

      const totalLikes = likesData?.length || 0;

      // Obtener contadores reales de seguidores y seguidos
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      const actualFollowersCount = followersData?.length || 0;
      const actualFollowingCount = followingData?.length || 0;

      // Actualizar el perfil con los contadores reales
      const updatedProfile = {
        ...profileData,
        followers_count: actualFollowersCount,
        following_count: actualFollowingCount
      };

      setProfile(updatedProfile);
      setProducts(transformedProducts);
      setStats({
        totalSales,
        totalProducts,
        totalLikes
      });

      console.log('Profile loaded with followers:', actualFollowersCount, 'following:', actualFollowingCount);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearProfile = () => {
    setProfile(null);
    setProducts([]);
    setStats({
      totalSales: 0,
      totalProducts: 0,
      totalLikes: 0
    });
  };

  return {
    profile,
    products,
    stats,
    loading,
    fetchUserProfile,
    clearProfile,
  };
};
