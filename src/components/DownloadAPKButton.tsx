
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAndroid } from "@/hooks/useIsAndroid";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const DownloadAPKButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();
  const isAndroid = useIsAndroid();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: "📱 ERDEX ya está instalado",
        description: "La aplicación ya está disponible en tu dispositivo o no es compatible con PWA",
      });
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "🎉 ¡ERDEX instalado!",
          description: "La aplicación se ha añadido a tu pantalla de inicio",
        });
      } else {
        toast({
          title: "📱 Instalación cancelada",
          description: "Puedes instalar ERDEX más tarde desde el menú del navegador",
        });
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast({
        title: "❌ Error de instalación",
        description: "No se pudo instalar la aplicación. Intenta desde el menú del navegador.",
        variant: "destructive"
      });
    }
  };

  // Don't render if not Android or if already installed
  if (!isAndroid) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstallPWA}
      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg"
    >
      <Download className="w-4 h-4 mr-2" />
      Descargar ERDEX
    </Button>
  );
};
