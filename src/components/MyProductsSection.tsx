
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Edit, Trash2, Eye, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMyProducts } from "@/hooks/useMyProducts";

export const MyProductsSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { myProducts, loading, deleteProduct } = useMyProducts();

  const filteredProducts = myProducts.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = myProducts.reduce((sum, product) => sum + product.sales, 0);
  const totalRevenue = myProducts.reduce((sum, product) => sum + (product.sales * product.price), 0);

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.")) {
      await deleteProduct(productId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Cargando tus productos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Mis Productos</h1>
        <p className="text-gray-300 text-sm sm:text-base">Gestiona todos los productos que has publicado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Productos Publicados</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{myProducts.length}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Ventas Totales</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{totalSales}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Ingresos Totales</p>
                <p className="text-xl sm:text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto sm:mx-0">
        <Input
          placeholder="Buscar mis productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader className="p-0">
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-t-lg flex items-center justify-center">
                <Package className="w-8 h-8 sm:w-12 sm:h-12 text-white/50" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${product.status === 'active' 
                    ? 'bg-green-500/20 text-green-200 border-green-500/30' 
                    : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
                  }`}
                >
                  {product.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30 text-xs">
                  {product.category}
                </Badge>
              </div>
              <CardTitle className="text-white text-base sm:text-lg mb-2 line-clamp-2">
                {product.title}
              </CardTitle>
              <CardDescription className="text-gray-300 mb-3 text-sm line-clamp-2">
                {product.description}
              </CardDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-2xl font-bold text-white">
                    {product.is_free ? "GRATIS" : `$${product.price}`}
                  </span>
                  <span className="text-yellow-400 text-sm">★ {product.rating}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{product.sales} ventas</span>
                  <span>{product.views} vistas</span>
                </div>
                <p className="text-xs text-gray-500">
                  Creado: {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-3 sm:p-4 pt-0 space-y-2">
              <div className="flex gap-1 w-full">
                <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-white/20 text-xs">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Ver
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-white/20 text-xs">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-400 hover:bg-red-500/20 px-2"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No tienes productos publicados</h3>
          <p className="text-gray-400 text-sm">¡Publica tu primer producto desde la sección "Productos"!</p>
        </div>
      )}
    </div>
  );
};
