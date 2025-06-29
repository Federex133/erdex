
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TopSeller {
  id: string;
  username: string;
  avatar_url?: string;
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  rank: number;
}

export const useTopSellers = () => {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTopSellers = async () => {
    try {
      setLoading(true);

      // Obtener el primer y último día del mes actual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Obtener productos con ventas del mes actual
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          user_id,
          sales,
          price,
          created_at
        `)
        .eq('status', 'active')
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
        .gt('sales', 0);

      if (productsError) throw productsError;

      // Agrupar ventas por usuario
      const userSales = new Map<string, { totalSales: number; totalRevenue: number; totalProducts: number }>();

      products?.forEach(product => {
        const userId = product.user_id;
        const current = userSales.get(userId) || { totalSales: 0, totalRevenue: 0, totalProducts: 0 };
        
        userSales.set(userId, {
          totalSales: current.totalSales + product.sales,
          totalRevenue: current.totalRevenue + (product.sales * product.price),
          totalProducts: current.totalProducts + 1
        });
      });

      // Obtener información de los perfiles de los vendedores
      const userIds = Array.from(userSales.keys());
      
      if (userIds.length === 0) {
        setTopSellers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar datos y crear ranking
      const sellersWithData = profiles?.map(profile => {
        const salesData = userSales.get(profile.id)!;
        return {
          id: profile.id,
          username: profile.username || 'Vendedor Anónimo',
          avatar_url: profile.avatar_url,
          ...salesData
        };
      }) || [];

      // Ordenar por total de ventas (cantidad de productos vendidos)
      const sortedSellers = sellersWithData
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10) // Top 10
        .map((seller, index) => ({
          ...seller,
          rank: index + 1
        }));

      setTopSellers(sortedSellers);

    } catch (error) {
      console.error('Error fetching top sellers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los vendedores destacados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSellers();
  }, []);

  return {
    topSellers,
    loading,
    refreshTopSellers: fetchTopSellers,
  };
};
