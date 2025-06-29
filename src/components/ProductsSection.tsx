import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShoppingBag, Heart, TrendingUp, User, Plus, Eye, Star, ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { CreateProductModal } from "./CreateProductModal";
import { ProductDetails } from "./ProductDetails";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

interface ProductsSectionProps {
  onUserSelect?: (userId: string) => void;
}

export const ProductsSection = ({ onUserSelect }: ProductsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const [purchasedProducts, setPurchasedProducts] = useState<Set<string>>(new Set());
  const { products, loading, createProduct } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart, isProductInCart } = useCart();

  const categories = ["all", "templates", "graphics", "music", "videos", "software", "other"];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separar productos destacados pagados y productos normales
  const featuredProducts = filteredProducts.filter(product => product.is_featured);
  const regularProducts = filteredProducts.filter(product => !product.is_featured);

  const fetchUserProfiles = async () => {
    if (filteredProducts.length === 0) return;
    
    const userIds = [...new Set(filteredProducts.map(product => product.user_id))];
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (error) throw error;
      
      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as {[key: string]: any}) || {};
      
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const handleProductClick = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ views: product.views + 1 })
        .eq('id', product.id);

      if (error) throw error;

      setSelectedProduct({
        ...product,
        views: product.views + 1
      });
    } catch (error) {
      console.error('Error updating product views:', error);
      setSelectedProduct(product);
    }
  };

  useEffect(() => {
    fetchUserProfiles();
  }, [filteredProducts]);

  const handleUserClick = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  const handleProductBuy = async (product: any) => {
    try {
      setPurchasedProducts(prev => new Set([...prev, product.id]));
      
      const { error } = await supabase
        .from('products')
        .update({ sales: product.sales + 1 })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "¡Compra exitosa!",
        description: `Has adquirido "${product.title}" exitosamente. Ahora puedes descargarlo.`,
      });
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Error",
        description: "Hubo un problema procesando la compra.",
        variant: "destructive",
      });
    }
  };

  const handleProductDownload = async (product: any) => {
    try {
      if (product.file_url) {
        const link = document.createElement('a');
        link.href = product.file_url;
        link.download = `${product.title}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Descarga iniciada",
          description: `Descargando "${product.title}"...`,
        });
      } else {
        toast({
          title: "Descarga simulada",
          description: `"${product.title}" se está descargando (archivo de demostración)`,
        });
        
        const content = `Producto: ${product.title}\nDescripción: ${product.description}\nPrecio: $${product.price}\n\nEste es un archivo de demostración.\nEn un sistema real, aquí estaría el producto digital real.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${product.title}_demo.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading product:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProduct = async (productData: any) => {
    const result = await createProduct(productData);
    if (!result.error) {
      setShowCreateModal(false);
    }
    return result;
  };

  const renderProductCard = (product: any, isFeatured = false) => {
    const userProfile = userProfiles[product.user_id];
    const isPurchased = purchasedProducts.has(product.id) || product.is_free;
    const inCart = isProductInCart(product.id);
    const isOwner = user && user.id === product.user_id;
    
    return (
      <Card key={product.id} className={`bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 group ${isFeatured ? 'ring-2 ring-yellow-400/50' : ''}`}>
        <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden cursor-pointer relative" onClick={() => handleProductClick(product)}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Destacado
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar 
              className="w-6 h-6 cursor-pointer" 
              onClick={() => handleUserClick(product.user_id)}
            >
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-purple-500/20 text-white text-xs">
                <User className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <span 
              className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors"
              onClick={() => handleUserClick(product.user_id)}
            >
              {userProfile?.username || 'Usuario'}
            </span>
          </div>
          
          <h3 className="font-semibold text-white mb-2 line-clamp-1 cursor-pointer" onClick={() => handleProductClick(product)}>
            {product.title}
          </h3>
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {product.is_free ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Gratis
                </Badge>
              ) : (
                <span className="text-lg font-bold text-white">
                  ${product.price}
                </span>
              )}
            </div>
            {!isPurchased && !isOwner && (
                <Button
                    size="sm"
                    variant={inCart ? "outline" : "default"}
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                    }}
                    disabled={inCart}
                    className={`${inCart ? "border-purple-500 text-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"} transition-all`}
                >
                    <ShoppingCartIcon className="w-4 h-4 mr-2" />
                    {inCart ? "Añadido" : "Añadir"}
                </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{product.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{product.sales}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{product.views}</span>
              </div>
            </div>
            <Badge variant="outline" className="border-white/20 text-gray-300">
              {product.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (selectedProduct) {
    return (
      <ProductDetails
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onBuy={handleProductBuy}
        onDownload={handleProductDownload}
        isPurchased={purchasedProducts.has(selectedProduct.id) || selectedProduct.is_free}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Productos Digitales</h1>
          <p className="text-gray-300">Descubre y compra productos digitales únicos</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Publicar Producto
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "Todas las categorías" : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center text-white">Cargando productos...</div>
      ) : (
        <div className="space-y-8">
          {/* Featured Products Section */}
          {featuredProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Productos Destacados</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => renderProductCard(product, true))}
              </div>
            </div>
          )}

          {/* Regular Products Section */}
          {regularProducts.length > 0 && (
            <div>
              {featuredProducts.length > 0 && (
                <h2 className="text-xl font-semibold text-white mb-4">Todos los Productos</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularProducts.map((product) => renderProductCard(product, false))}
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No se encontraron productos</h3>
              <p className="text-gray-400">Intenta con otros términos de búsqueda o categorías</p>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProduct={handleCreateProduct}
      />
    </div>
  );
};
