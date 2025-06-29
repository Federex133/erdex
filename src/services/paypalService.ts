// Servicio para manejar pagos con comisiones automáticas via PayPal
interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

interface PaymentRequest {
  amount: number;
  currency: string;
  sellerEmail: string;
  productName: string;
  productId: number;
}

interface PaymentResponse {
  paymentId: string;
  status: string;
  adminPayout: number;
  sellerPayout: number;
  transactionId: string;
}

class PayPalService {
  private credentials: PayPalCredentials;
  private baseUrl: string;
  private adminEmail = 'Mr.federex@gmail.com';

  constructor() {
    this.credentials = {
      clientId: 'BAATromM_MagyjyD2ovjAQ9Z_aVdPPbbcVbVkJ6RptlUscltZ0UPHNsvI3d9p08FOIFrSN5lq3xZiiJZe8',
      clientSecret: 'EHxumjQQwHhCk8eYqLnI7N21CRFItjll1RV0Up1B01ZV4ZWZo-ehY7BNOTF0VNiZLsKbWvkEZ_xfmj6_',
      mode: 'live'
    };
    this.baseUrl = this.credentials.mode === 'sandbox' 
      ? 'https://api.sandbox.paypal.com' 
      : 'https://api.paypal.com';
  }

  async getAccessToken(): Promise<string> {
    const auth = btoa(`${this.credentials.clientId}:${this.credentials.clientSecret}`);
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Error obteniendo token de acceso');
    }

    const data = await response.json();
    return data.access_token;
  }

  // Método para crear una orden de pago
  async createPaymentOrder(paymentRequest: PaymentRequest): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
      
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentRequest.currency,
            value: paymentRequest.amount.toFixed(2)
          },
          description: paymentRequest.productName,
          custom_id: `product_${paymentRequest.productId}`
        }],
        application_context: {
          return_url: `${window.location.origin}/?payment=success`,
          cancel_url: `${window.location.origin}/?payment=cancel`,
          brand_name: 'Digital Emporium Genesis Hub',
          user_action: 'PAY_NOW'
        }
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Error creando orden de pago');
      }

      const order = await response.json();
      const approveLink = order.links.find((link: any) => link.rel === 'approve');
      return approveLink ? approveLink.href : '';
    } catch (error) {
      console.error('Error creando orden de pago:', error);
      throw error;
    }
  }

  // Método para capturar el pago y procesar las comisiones automáticamente
  async captureAndProcessPayment(orderId: string, paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      // 1. Capturar el pago del cliente
      const captureResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!captureResponse.ok) {
        const errorDetails = await captureResponse.json();
        console.error('Error details capturando el pago:', errorDetails);
        throw new Error('Error capturando el pago del cliente');
      }

      const captureResult = await captureResponse.json();
      console.log('Resultado de captura de pago:', captureResult);
      
      if (captureResult.status === 'COMPLETED') {
        // El pago fue capturado exitosamente en la cuenta principal de la plataforma.
        const totalAmount = paymentRequest.amount;
        const adminCommission = totalAmount * 0.20;
        const sellerCommission = totalAmount * 0.80;

        // 2. Procesar las comisiones al vendedor usando PayPal Payouts.
        // Esto envía el 80% al vendedor desde la cuenta de la plataforma.
        console.log(`Iniciando pago de comisión de ${sellerCommission.toFixed(2)} USD al vendedor: ${paymentRequest.sellerEmail}`);

        const payoutData = {
          sender_batch_header: {
            sender_batch_id: `payout_batch_${captureResult.id}`,
            email_subject: `¡Has recibido un pago por tu venta!`,
            email_message: `Has recibido un pago por la venta de tu producto: "${paymentRequest.productName}".`
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: sellerCommission.toFixed(2),
                currency: paymentRequest.currency
              },
              receiver: paymentRequest.sellerEmail,
              note: `Pago del 80% por la venta de "${paymentRequest.productName}" (ID: ${paymentRequest.productId})`,
              sender_item_id: `seller_payout_${paymentRequest.productId}_${Date.now()}`
            }
          ]
        };

        const payoutResponse = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payoutData)
        });

        const payoutResult = await payoutResponse.json();

        if (!payoutResponse.ok) {
          console.error('Error de PayPal Payouts:', payoutResult);
          throw new Error(`El pago del cliente fue exitoso, pero falló la transferencia de comisiones al vendedor. Detalles: ${payoutResult.message || 'Error desconocido'}`);
        }

        console.log('Resultado del Payout (envío a vendedor):', payoutResult);
        
        return {
          paymentId: captureResult.id,
          status: 'completed',
          adminPayout: adminCommission,
          sellerPayout: sellerCommission,
          transactionId: payoutResult.batch_header.payout_batch_id || `TXN_${Date.now()}`
        };
      } else {
        throw new Error('El pago del cliente no se completó correctamente.');
      }
    } catch (error) {
      console.error('Error en el proceso de pago y comisiones:', error);
      throw error;
    }
  }
}

export const paypalService = new PayPalService();
export type { PaymentRequest, PaymentResponse };
