
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ShoppingCart, ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const CartSection = ({ onBack }: { onBack: () => void }) => {
  const { cartItems, removeFromCart, loading, cartCount, clearCart, total } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !loading) {
      onBack();
    }
  }, [user, loading, onBack]);
  
  const handleCheckout = () => {
    // Here we can integrate a payment gateway like Stripe or PayPal
    toast({
      title: "Procesando pago...",
      description: "Esta es una simulación. ¡Gracias por tu compra!",
    });
    
    setTimeout(() => {
      clearCart();
      toast({
        title: "¡Compra completada!",
        description: "Tus productos ahora están disponibles para descargar.",
      });
      onBack();
    }, 2000);
  };

  const renderProduct = (item: CartItem) => {
    if (!item.products) return null;
    
    return (
      <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <img 
          src={item.products.image_url || '/placeholder.svg'} 
          alt={item.products.title} 
          className="w-20 h-20 object-cover rounded-md"
        />
        <div className="flex-grow">
          <h3 className="font-semibold text-white">{item.products.title}</h3>
          <p className="text-sm text-gray-400">{item.products.category}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">${item.products.price.toFixed(2)}</p>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => removeFromCart(item.id)}>
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center text-white py-20">Cargando carrito...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-white min-h-screen">
      <div className="flex justify-start mb-6">
        <Button onClick={onBack} variant="outline" className="bg-transparent border-white/20 hover:bg-white/10">
            <span className="inline-flex items-center gap-2 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Volver a la tienda
            </span>
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-white">
            <ShoppingCart className="w-6 h-6" />
            Tu Carrito de Compras ({cartCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length > 0 ? (
            <div className="space-y-4">{cartItems.map(renderProduct)}</div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Tu carrito está vacío</h3>
              <p>Añade productos para verlos aquí.</p>
            </div>
          )}
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/20 p-6 mt-4 rounded-b-lg">
            <div className="text-2xl font-bold text-white">
              Total: <span className="text-purple-400">${total.toFixed(2)}</span>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={handleCheckout}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceder al Pago
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
