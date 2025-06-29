
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { paypalService, PaymentRequest } from "@/services/paypalService";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    title: string;
    price: number;
    seller: string;
    paypalEmail: string;
  };
  onPaymentSuccess: (transactionData: any) => void;
}

export const PaymentModal = ({ isOpen, onClose, product, onPaymentSuccess }: PaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const paymentRequest: PaymentRequest = {
        amount: product.price,
        currency: 'USD',
        sellerEmail: product.paypalEmail,
        productName: product.title,
        productId: product.id
      };

      // Crear orden de pago en PayPal
      const approvalUrl = await paypalService.createPaymentOrder(paymentRequest);
      
      if (approvalUrl) {
        // Extraer el order ID de la URL
        const urlParams = new URLSearchParams(approvalUrl.split('?')[1]);
        const orderId = urlParams.get('token');
        setCurrentOrderId(orderId);
        
        // Abrir PayPal en nueva ventana
        const paypalWindow = window.open(approvalUrl, '_blank', 'width=600,height=700');
        
        // Monitorear el cierre de la ventana de PayPal
        const checkClosed = setInterval(async () => {
          if (paypalWindow?.closed) {
            clearInterval(checkClosed);
            
            // Verificar si el pago fue realmente completado
            if (orderId) {
              try {
                // Intentar capturar el pago y procesar comisiones
                const result = await paypalService.captureAndProcessPayment(orderId, paymentRequest);
                
                if (result.status === 'completed') {
                  setTransactionDetails(result);
                  setPaymentStatus('success');
                  
                  toast({
                    title: "¡Pago y comisiones procesados!",
                    description: `La compra de "${product.title}" y el reparto de comisiones se completaron.`,
                  });
                  
                  // Notificar al componente padre que el pago fue exitoso
                  onPaymentSuccess(result);
                } else {
                  throw new Error('El estado del pago no fue "completed"');
                }
              } catch (error) {
                console.error('Error verificando pago y procesando comisiones:', error);
                setPaymentStatus('error');
                
                const errorMessage = (error as Error).message || '';
                if (errorMessage.includes('falló la transferencia de comisiones')) {
                   toast({
                    title: "¡Atención, Admin!",
                    description: "El pago del cliente fue exitoso, pero la transferencia automática de comisiones al vendedor falló. Revisa la transacción manualmente.",
                    variant: "destructive",
                    duration: 10000,
                  });
                } else {
                  toast({
                    title: "Pago no completado",
                    description: "No se pudo verificar el pago. Si realizaste el pago, contacta soporte.",
                    variant: "destructive"
                  });
                }
              }
            } else {
              setPaymentStatus('error');
              toast({
                title: "Pago cancelado",
                description: "El pago no se completó.",
                variant: "destructive"
              });
            }
            setIsProcessing(false);
          }
        }, 1000);
        
        // Limpiar el intervalo después de 10 minutos por seguridad
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!paypalWindow?.closed) {
            setPaymentStatus('error');
            setIsProcessing(false);
            toast({
              title: "Tiempo agotado",
              description: "El proceso de pago ha expirado.",
              variant: "destructive"
            });
          }
        }, 600000); // 10 minutos
      }
    } catch (error) {
      console.error('Error iniciando pago:', error);
      setPaymentStatus('error');
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago",
        variant: "destructive"
      });
    }
  };

  const resetModal = () => {
    setPaymentStatus('idle');
    setTransactionDetails(null);
    setIsProcessing(false);
    setCurrentOrderId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Procesar Pago</DialogTitle>
          <DialogDescription className="text-gray-300">
            Pago seguro con PayPal - División automática de comisiones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalles del producto */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <h3 className="text-white font-medium">{product.title}</h3>
              <p className="text-gray-300 text-sm">Por: {product.seller}</p>
              <p className="text-2xl font-bold text-white mt-2">${product.price}</p>
            </CardContent>
          </Card>

          {/* División de comisiones */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-3">División de Comisiones</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Vendedor (80%):</span>
                  <span className="text-green-400 font-medium">${(product.price * 0.8).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Plataforma (20%):</span>
                  <span className="text-purple-400 font-medium">${(product.price * 0.2).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total:</span>
                    <span className="text-white">${product.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estados del pago */}
          {paymentStatus === 'idle' && (
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Abriendo PayPal...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar con PayPal
                </>
              )}
            </Button>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-white">Verificando pago...</p>
              <p className="text-gray-400 text-sm">Completa el pago en la ventana de PayPal</p>
            </div>
          )}

          {paymentStatus === 'success' && transactionDetails && (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white font-medium">¡Pago y comisiones procesados!</p>
              <p className="text-gray-300 text-sm">ID Lote Payout: {transactionDetails.transactionId}</p>
              <div className="mt-3 text-xs text-gray-400">
                <p>Vendedor recibió: ${transactionDetails.sellerPayout.toFixed(2)}</p>
                <p>Comisión plataforma: ${transactionDetails.adminPayout.toFixed(2)}</p>
              </div>
              <Button onClick={resetModal} className="mt-4 w-full">
                Continuar
              </Button>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-4">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-white font-medium">Pago no completado</p>
              <p className="text-gray-400 text-sm">El pago no se pudo verificar</p>
              <Button 
                onClick={() => setPaymentStatus('idle')} 
                variant="outline" 
                className="mt-4 w-full"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
