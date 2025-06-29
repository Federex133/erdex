
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  productId: number;
  productName: string;
  totalPrice: number;
  adminCommission: number;
  sellerCommission: number;
  sellerPayPal: string;
  buyerEmail: string;
  status: "completed" | "pending" | "failed";
  date: string;
  paymentId?: string;
}

export const CommissionSystem = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "TXN_1703123456789",
      productId: 1,
      productName: "Curso de Diseño Web",
      totalPrice: 49.99,
      adminCommission: 9.99,
      sellerCommission: 39.99,
      sellerPayPal: "webmaster@example.com",
      buyerEmail: "cliente@example.com",
      status: "completed",
      date: "2024-01-15",
      paymentId: "PAYID-123456"
    },
    {
      id: "TXN_1703123456790",
      productId: 2,
      productName: "Pack de Iconos UI",
      totalPrice: 19.99,
      adminCommission: 3.99,
      sellerCommission: 15.99,
      sellerPayPal: "designpro@example.com",
      buyerEmail: "cliente2@example.com",
      status: "pending",
      date: "2024-01-14"
    }
  ]);

  const [weeklyReport, setWeeklyReport] = useState({
    totalSales: 0,
    totalCommissions: 0,
    productsSold: 0,
    uniqueCustomers: 0
  });

  useEffect(() => {
    // Calcular reporte semanal
    const completedTransactions = transactions.filter(t => t.status === "completed");
    const report = {
      totalSales: completedTransactions.reduce((sum, t) => sum + t.totalPrice, 0),
      totalCommissions: completedTransactions.reduce((sum, t) => sum + t.adminCommission, 0),
      productsSold: completedTransactions.length,
      uniqueCustomers: new Set(completedTransactions.map(t => t.buyerEmail)).size
    };
    setWeeklyReport(report);
  }, [transactions]);

  const processPayment = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    console.log("Procesando pago automático con PayPal API:", {
      transactionId,
      adminPayout: {
        amount: transaction.adminCommission,
        recipient: "Mr.federex@gmail.com"
      },
      sellerPayout: {
        amount: transaction.sellerCommission,
        recipient: transaction.sellerPayPal
      }
    });

    // Simular procesamiento automático
    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, status: "completed" as const, paymentId: `PAYID-${Date.now()}` }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Reporte Semanal */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Reporte Semanal - Sistema Automático</CardTitle>
          <CardDescription className="text-gray-300">
            Comisiones procesadas automáticamente via PayPal Business API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">${weeklyReport.totalSales.toFixed(2)}</p>
              <p className="text-gray-300 text-sm">Ventas Totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">${weeklyReport.totalCommissions.toFixed(2)}</p>
              <p className="text-gray-300 text-sm">Mis Comisiones (20%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{weeklyReport.productsSold}</p>
              <p className="text-gray-300 text-sm">Productos Vendidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-400">{weeklyReport.uniqueCustomers}</p>
              <p className="text-gray-300 text-sm">Clientes Únicos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Comisiones */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Configuración PayPal - Comisiones Automáticas</CardTitle>
          <CardDescription className="text-gray-300">
            Sistema integrado con PayPal Business API para división automática de pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-white">Mi comisión (Admin)</span>
              </div>
              <Badge className="bg-green-500/20 text-green-300">20% Automático</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-white">Comisión del vendedor</span>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300">80% Automático</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-white">Mi PayPal (Comisiones)</span>
              </div>
              <div className="text-right">
                <span className="text-purple-300 font-medium">Mr.federex@gmail.com</span>
                <p className="text-xs text-gray-400">Configurado ✓</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-orange-500/30">
              <div className="flex items-center space-x-3">
                <span className="text-white">Modo de API</span>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300">Sandbox (Pruebas)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transacciones */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Transacciones con Comisiones Automáticas</CardTitle>
          <CardDescription className="text-gray-300">
            Historial de pagos procesados con división automática via PayPal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{transaction.productName}</h4>
                    <p className="text-gray-400 text-sm">ID: {transaction.id}</p>
                    {transaction.paymentId && (
                      <p className="text-gray-400 text-sm">PayPal ID: {transaction.paymentId}</p>
                    )}
                    <p className="text-gray-400 text-sm">Fecha: {transaction.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={transaction.status === "completed" ? "default" : transaction.status === "pending" ? "secondary" : "destructive"}
                      className={
                        transaction.status === "completed" 
                          ? "bg-green-500/20 text-green-300 border-green-500/30" 
                          : transaction.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }
                    >
                      {transaction.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {transaction.status === "pending" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {transaction.status === "completed" ? "Completado" : transaction.status === "pending" ? "Pendiente" : "Fallido"}
                    </Badge>
                    {transaction.paymentId && (
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Precio Total</p>
                    <p className="text-white font-medium">${transaction.totalPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Mi Comisión (20%)</p>
                    <p className="text-green-400 font-medium">${transaction.adminCommission} → Mr.federex@gmail.com</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Comisión Vendedor (80%)</p>
                    <p className="text-blue-400 font-medium">${transaction.sellerCommission} → {transaction.sellerPayPal}</p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-gray-400 text-sm">Comprador: {transaction.buyerEmail}</p>
                  {transaction.status === "completed" && (
                    <p className="text-green-400 text-sm">✓ Comisiones transferidas automáticamente</p>
                  )}
                </div>

                {transaction.status === "pending" && (
                  <div className="mt-3">
                    <Button 
                      size="sm"
                      onClick={() => processPayment(transaction.id)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Procesar Comisiones Automáticas
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
