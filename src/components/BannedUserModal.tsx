import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBanCheck } from '@/hooks/useBanCheck';
import { useToast } from '@/hooks/use-toast';

interface BannedUserModalProps {
  reason?: string;
  bannedUntil?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const BannedUserModal = ({ reason, bannedUntil }: BannedUserModalProps) => {
  const { signOut } = useAuth();
  const { banStatus } = useBanCheck();
  const { toast } = useToast();

  // Auto-close modal if user is unbanned
  useEffect(() => {
    if (banStatus && !banStatus.is_banned) {
      toast({
        title: "Cuenta restaurada",
        description: "Tu cuenta ha sido restaurada. Ya puedes acceder a la plataforma.",
      });
      // The modal will be hidden automatically by the parent component
      // when banStatus.is_banned becomes false
    }
  }, [banStatus, toast]);

  const handleLogout = () => {
    signOut();
  };

  // Don't show modal if user is not banned
  if (!banStatus?.is_banned) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-900/95 backdrop-blur-lg border-red-500/30 text-white max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-red-400 text-xl">Cuenta Suspendida</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {banStatus.reason && (
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-2">Razón del ban:</h3>
              <p className="text-gray-300">{banStatus.reason}</p>
            </div>
          )}

          {banStatus.banned_until && (
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h3 className="font-semibold text-yellow-400 mb-2">Ban temporal hasta:</h3>
              <p className="text-gray-300">{formatDate(banStatus.banned_until)}</p>
            </div>
          )}

          {!banStatus.banned_until && (
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-2">Ban permanente</h3>
              <p className="text-gray-300">Esta suspensión es permanente.</p>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-blue-300 text-sm">
              <strong>Nota:</strong> Si crees que esto es un error, contacta con el soporte técnico.
            </p>
          </div>

          <Button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
