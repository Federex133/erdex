
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Package, DollarSign } from "lucide-react";
import { useTopSellers } from "@/hooks/useTopSellers";

interface TopSellersSectionProps {
  onUserSelect?: (userId: string) => void;
}

export const TopSellersSection = ({ onUserSelect }: TopSellersSectionProps) => {
  const { topSellers, loading } = useTopSellers();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-lg font-bold text-white">{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case 2:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case 3:
        return "bg-amber-600/20 text-amber-300 border-amber-600/30";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🏆 Ranking del Mes</h1>
          <p className="text-gray-300">Cargando vendedores destacados...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          🏆 Ranking de Vendedores - {getCurrentMonth()}
        </h1>
        <p className="text-gray-300">Los vendedores más exitosos del mes actual</p>
      </div>

      {topSellers.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Sin ventas este mes
            </h3>
            <p className="text-gray-400">
              Aún no hay vendedores con ventas registradas en {getCurrentMonth()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topSellers.map((seller) => (
            <Card 
              key={seller.id} 
              className={`bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer ${
                seller.rank <= 3 ? 'ring-2 ring-yellow-500/30' : ''
              }`}
              onClick={() => onUserSelect?.(seller.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRankIcon(seller.rank)}
                    <Badge className={getRankBadgeColor(seller.rank)}>
                      #{seller.rank}
                    </Badge>
                  </div>
                  {seller.rank === 1 && (
                    <div className="text-xs font-bold text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">
                      ¡CAMPEÓN!
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Perfil del vendedor */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={seller.avatar_url} />
                    <AvatarFallback className="bg-purple-500/20 text-white">
                      {seller.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-semibold">{seller.username}</h3>
                    <p className="text-gray-400 text-sm">Vendedor estrella</p>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Package className="w-4 h-4" />
                      <span className="text-sm">Productos vendidos</span>
                    </div>
                    <span className="text-white font-bold">{seller.totalSales}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Ingresos totales</span>
                    </div>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(seller.totalRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Productos activos</span>
                    </div>
                    <span className="text-blue-400 font-bold">{seller.totalProducts}</span>
                  </div>
                </div>

                {/* Promedio por producto */}
                <div className="pt-3 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Promedio por producto</p>
                    <p className="text-white font-bold">
                      {formatCurrency(seller.totalRevenue / seller.totalProducts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
