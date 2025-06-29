import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Package, Heart, MessageSquare, Star, ArrowLeft, Download, ShoppingCart, ImageIcon, Trash2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useProductComments } from "@/hooks/useProductComments";
import { useProductLikes } from "@/hooks/useProductLikes";
import { useAuth } from "@/hooks/useAuth";
import { PaymentModal } from "./PaymentModal";

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onBuy: (product: Product) => void;
  onDownload: (product: Product) => void;
  isPurchased: boolean;
}

export const ProductDetails = ({ product, onBack, onBuy, onDownload, isPurchased }: ProductDetailsProps) => {
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [productPurchased, setProductPurchased] = useState(isPurchased);
  const [realPaymentCompleted, setRealPaymentCompleted] = useState(false);
  const { user } = useAuth();
  
  // Usar hooks reales para comentarios y likes
  const { comments, loading: commentsLoading, createComment, deleteComment } = useProductComments(product.id);
  const { isLiked, likesCount, toggleLike } = useProductLikes(product.id);

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      const result = await createComment(newComment, newRating);
      if (!result.error) {
        setNewComment("");
        setNewRating(5);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const handleBuyClick = () => {
    if (product.is_free) {
      // Para productos gratuitos, marcar como comprado directamente
      setProductPurchased(true);
      setRealPaymentCompleted(true);
      onBuy(product);
    } else {
      // Para productos pagos, abrir modal de pago
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (transactionData: any) => {
    console.log('Payment successful:', transactionData);
    // Solo marcar como comprado si el pago fue realmente exitoso y verificado
    if (transactionData && transactionData.status === 'completed' && transactionData.paymentId) {
      setProductPurchased(true);
      setRealPaymentCompleted(true);
      setShowPaymentModal(false);
      onBuy(product);
    }
  };

  const handleDownloadClick = () => {
    // Solo permitir descarga si realmente está comprado o es gratis
    if ((productPurchased && realPaymentCompleted) || product.is_free) {
      onDownload(product);
    }
  };

  // Determinar si el producto está realmente disponible para descarga
  const isAvailableForDownload = product.is_free || (productPurchased && realPaymentCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{product.title}</h1>
          <p className="text-gray-300">Detalles del producto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image/Preview */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-t-lg flex items-center justify-center relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <Package className="w-16 h-16 text-white/50" />
                )}
                
                {product.is_featured && (
                  <Badge className="absolute top-4 left-4 bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
                    Destacado
                  </Badge>
                )}
                {product.is_free && (
                  <Badge className="absolute top-4 right-4 bg-green-500/20 text-green-200 border-green-500/30">
                    GRATIS
                  </Badge>
                )}
              </div>
              
              {/* Product Previews/Screenshots */}
              <div className="p-4">
                <h3 className="text-white font-semibold mb-3">Vista previa del producto</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.preview_images && product.preview_images.length > 0 ? (
                    product.preview_images.map((imageUrl, index) => (
                      <div key={index} className="aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={`Vista previa ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))
                  ) : (
                    // Fallback preview images when no previews are available
                    [1, 2, 3].map((item) => (
                      <div key={item} className="aspect-square bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white/30" />
                      </div>
                    ))
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  {product.preview_images && product.preview_images.length > 0 
                    ? `${product.preview_images.length} imagen(es) de vista previa disponible(s)`
                    : "* Las imágenes de vista previa son ejemplos del contenido incluido"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {product.description || "Sin descripción disponible"}
              </p>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comentarios ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-white text-sm">Calificación:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 cursor-pointer ${
                            star <= newRating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                          }`}
                          onClick={() => setNewRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Escribe tu comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Enviar Comentario
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Inicia sesión para comentar</p>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <p className="text-gray-400 text-sm">Cargando comentarios...</p>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {comment.profiles?.username ? comment.profiles.username.substring(0, 1).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <span className="text-white font-medium text-sm">
                            {comment.profiles?.username || 'Usuario'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < comment.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                          {/* Delete button - only show for own comments */}
                          {user && comment.user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay comentarios aún</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-white">
                    {product.is_free ? "GRATIS" : `$${product.price}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-400' : ''}`}
                    onClick={toggleLike}
                    disabled={!user}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="ml-1 text-sm">{likesCount}</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    {product.category}
                  </Badge>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>★ {product.rating}</span>
                    <span>{product.sales} ventas</span>
                    <span>{product.views} vistas</span>
                  </div>
                </div>

                {!product.is_free && (
                  <div className="p-3 bg-white/5 rounded text-xs">
                    <p className="text-gray-400 mb-1">División automática:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-green-400">Vendedor (80%):</span>
                        <span className="text-green-400">${(product.price * 0.8).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-400">Plataforma (20%):</span>
                        <span className="text-purple-400">${(product.price * 0.2).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isAvailableForDownload ? (
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      onClick={handleDownloadClick}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Producto
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={handleBuyClick}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Comprar ${product.price}
                    </Button>
                  )}
                </div>

                {/* Product Details */}
                <div className="border-t border-white/20 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creado:</span>
                    <span className="text-white">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actualizado:</span>
                    <span className="text-white">{new Date(product.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className="text-green-400">{product.status}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {product.user_id.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">Vendedor</p>
                  <p className="text-gray-400 text-sm">Miembro desde 2024</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-white/20 text-white hover:bg-white/10">
                Ver Perfil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && !product.is_free && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          product={{
            id: parseInt(product.id),
            title: product.title,
            price: product.price,
            seller: "Vendedor",
            paypalEmail: product.paypal_email || "seller@example.com"
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
