import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isCurrentlyBanned?: boolean;
  onBanComplete: (userId: string, banned: boolean, reason?: string, isPermanent?: boolean, bannedUntil?: Date) => Promise<boolean>;
}

export const BanUserDialog = ({ 
  isOpen, 
  onClose, 
  userId, 
  username, 
  isCurrentlyBanned = false,
  onBanComplete 
}: BanUserDialogProps) => {
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [bannedUntil, setBannedUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setBannedUntil("");
      setIsPermanent(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (isCurrentlyBanned) {
      // Unban user
      setLoading(true);
      try {
        await onBanComplete(userId, false);
        onClose();
        toast({
          title: "Usuario desbaneado",
          description: `${username} ha sido desbaneado exitosamente`,
        });
      } catch (error) {
        console.error('Error unbanning user:', error);
        toast({
          title: "Error",
          description: "No se pudo desbanear al usuario",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Ban user
      if (!reason.trim()) {
        toast({
          title: "Error",
          description: "Debes especificar una razón para el ban",
          variant: "destructive",
        });
        return;
      }

      // Validate date for temporary ban
      if (!isPermanent && !bannedUntil.trim()) {
        toast({
          title: "Error",
          description: "Debes especificar una fecha de fin para el ban temporal",
          variant: "destructive",
        });
        return;
      }

      // Validate that the date is in the future
      if (!isPermanent && bannedUntil.trim()) {
        const selectedDate = new Date(bannedUntil);
        const now = new Date();
        if (selectedDate <= now) {
          toast({
            title: "Error",
            description: "La fecha de fin del ban debe ser en el futuro",
            variant: "destructive",
          });
          return;
        }
      }

      setLoading(true);
      try {
        const bannedUntilDate = !isPermanent && bannedUntil.trim() ? new Date(bannedUntil) : undefined;
        await onBanComplete(userId, true, reason, isPermanent, bannedUntilDate);
        onClose();
        toast({
          title: "Usuario baneado",
          description: `${username} ha sido baneado ${isPermanent ? 'permanentemente' : 'temporalmente'} exitosamente`,
        });
      } catch (error) {
        console.error('Error banning user:', error);
        toast({
          title: "Error",
          description: "No se pudo banear al usuario",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900/95 backdrop-blur-lg border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>
            {isCurrentlyBanned ? "Desbanear Usuario" : "Banear Usuario"}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {isCurrentlyBanned 
              ? `Vas a desbanear a: ${username}`
              : `Vas a banear a: ${username}`
            }
          </DialogDescription>
        </DialogHeader>

        {isCurrentlyBanned ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-green-300 text-sm">
                Al desbanear a este usuario, podrá volver a acceder a la plataforma inmediatamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-white">Razón del ban *</Label>
              <Textarea
                id="reason"
                placeholder="Escribe la razón del ban..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="permanent"
                checked={isPermanent}
                onCheckedChange={setIsPermanent}
              />
              <Label htmlFor="permanent" className="text-white">Ban permanente</Label>
            </div>

            {!isPermanent && (
              <div>
                <Label htmlFor="bannedUntil" className="text-white">Baneado hasta *</Label>
                <Input
                  id="bannedUntil"
                  type="datetime-local"
                  value={bannedUntil}
                  onChange={(e) => setBannedUntil(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Selecciona la fecha y hora hasta cuando estará baneado
                </p>
              </div>
            )}

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-300 text-sm">
                <strong>Advertencia:</strong> Esta acción es irreversible. El usuario no podrá acceder a la plataforma hasta que sea desbaneado.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={loading}
            className="bg-white/10 border-white/20 text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!isCurrentlyBanned && (!reason.trim() || (!isPermanent && !bannedUntil.trim())))}
            className={isCurrentlyBanned 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
            }
          >
            {loading 
              ? (isCurrentlyBanned ? "Desbaneando..." : "Baneando...") 
              : (isCurrentlyBanned ? "Desbanear Usuario" : "Banear Usuario")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
