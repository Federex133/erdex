
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { CommissionSystem } from "@/components/CommissionSystem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  commissions: number;
}

interface Sale {
  id: string;
  product: string;
  buyer: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
}

export const SalesSection = () => {
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    commissions: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // Obtener productos del usuario actual (simulando que hay un usuario logueado)
      const { data: userProducts, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      if (userProducts && Array.isArray(userProducts)) {
        // Calcular estadísticas
        const totalSales = userProducts.reduce((sum, product) => sum + (product.sales || 0), 0);
        const totalRevenue = userProducts.reduce((sum, product) => sum + ((product.sales || 0) * (product.price || 0)), 0);
        const commissions = totalRevenue * 0.8; // 80% para el vendedor
        
        // Obtener número único de "clientes" (simulado basado en ventas)
        const totalCustomers = Math.floor(totalSales * 0.7); // Estimación

        setStats({
          totalSales,
          totalRevenue,
          totalProducts: userProducts.length,
          totalCustomers,
          commissions
        });

        // Generar ventas recientes basadas en productos reales
        const salesData: Sale[] = userProducts
          .filter(product => product.sales > 0)
          .slice(0, 5)
          .map((product, index) => ({
            id: `sale-${product.id}-${index}`,
            product: product.title,
            buyer: `Cliente ${index + 1}`,
            amount: product.price,
            commission: product.price * 0.8,
            date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: index === 0 ? "Procesando" : "Completado"
          }));

        setRecentSales(salesData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number = 0) => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const statsDisplay = [
    {
      title: "Ventas Totales",
      value: formatCurrency(stats.totalRevenue),
      change: calculateChange(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "Productos Vendidos",
      value: stats.totalSales.toString(),
      change: calculateChange(stats.totalSales),
      icon: Package,
      color: "text-blue-400"
    },
    {
      title: "Mis Comisiones (80%)",
      value: formatCurrency(stats.commissions),
      change: calculateChange(stats.commissions),
      icon: TrendingUp,
      color: "text-purple-400"
    },
    {
      title: "Clientes",
      value: stats.totalCustomers.toString(),
      change: calculateChange(stats.totalCustomers),
      icon: Users,
      color: "text-pink-400"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ventas y Comisiones</h1>
          <p className="text-gray-300">Cargando datos de ventas...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ventas y Comisiones</h1>
        <p className="text-gray-300">Panel de control de ventas con sistema de comisiones automático</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-white/10 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sistema de Comisiones */}
      <CommissionSystem />

      {/* Recent Sales */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Ventas Recientes</CardTitle>
          <CardDescription className="text-gray-300">
            Tus últimas transacciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{sale.product}</h4>
                    <p className="text-gray-400 text-sm">Comprador: {sale.buyer}</p>
                    <p className="text-gray-400 text-sm">{sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(sale.amount)}</p>
                    <p className="text-green-400 text-sm">Comisión: {formatCurrency(sale.commission)}</p>
                    <Badge 
                      variant={sale.status === "Completado" ? "default" : "secondary"}
                      className={sale.status === "Completado" 
                        ? "bg-green-500/20 text-green-300 border-green-500/30" 
                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      }
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No hay ventas registradas</h3>
              <p className="text-gray-400 text-sm">¡Publica productos para comenzar a vender!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
