import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { BanUserDialog } from "@/components/BanUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsAndroid } from "@/hooks/useIsAndroid";
import { 
  Users, 
  Shield, 
  Ban, 
  Search, 
  UserCheck, 
  UserX, 
  Crown, 
  MessageCircle,
  Key,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSectionProps {
  onUserSelect: (userId: string) => void;
}

export const AdminSection = ({ onUserSelect }: AdminSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const { users, loading, toggleUserRole, toggleUserBan } = useAdminUsers();
  const { toast } = useToast();
  const isAndroid = useIsAndroid();

  const filteredUsers = users.filter(user => {
    const searchStr = `${user.username || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleToggleRole = async (userId: string, currentRole: boolean) => {
    try {
      await toggleUserRole(userId, !currentRole);
      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido ${currentRole ? 'removido' : 'asignado'} exitosamente.`,
      });
    } catch (error: any) {
      console.error('Error toggling user role:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const handleToggleBan = async (userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
    setShowBanDialog(true);
  };

  const handleResetPassword = (userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
    setShowResetPasswordDialog(true);
  };

  const handleBanDialogClose = () => {
    setShowBanDialog(false);
    setSelectedUserId(null);
    setSelectedUsername("");
  };

  const handleResetPasswordDialogClose = () => {
    setShowResetPasswordDialog(false);
    setSelectedUserId(null);
    setSelectedUsername("");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <div className="text-center text-white">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Shield className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
        <h1 className="text-xl md:text-3xl font-bold text-white">Panel de Administración</h1>
      </div>

      {/* Search */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="space-y-3 md:space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors ${
                  isAndroid ? 'space-y-3' : 'flex items-center justify-between'
                }`}
              >
                <div className={`flex items-center gap-3 md:gap-4 ${isAndroid ? 'w-full' : ''}`}>
                  <Avatar 
                    className="w-10 h-10 md:w-12 md:h-12 cursor-pointer flex-shrink-0" 
                    onClick={() => onUserSelect(user.id)}
                  >
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-purple-500/20 text-white">
                      <Users className="w-4 h-4 md:w-6 md:h-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        className="text-white font-semibold cursor-pointer hover:text-purple-300 text-sm md:text-base truncate"
                        onClick={() => onUserSelect(user.id)}
                      >
                        {user.username || 'Sin nombre'}
                      </h3>
                      {user.is_admin && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                          <Crown className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.is_banned && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                          <Ban className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                          Baneado
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">
                      Registrado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {/* Action buttons - Different layout for Android */}
                {isAndroid ? (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUserSelect(user.id)}
                      className="border-white/20 text-white hover:bg-white/10 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Ver Perfil
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        className="bg-gray-900/95 backdrop-blur-lg border-white/20 text-white w-56"
                        align="end"
                      >
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user.id, user.username || user.email)}
                          className="hover:bg-blue-500/20 focus:bg-blue-500/20"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Cambiar Contraseña
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem
                          onClick={() => handleToggleRole(user.id, user.is_admin || false)}
                          className={user.is_admin 
                            ? "hover:bg-yellow-500/20 focus:bg-yellow-500/20" 
                            : "hover:bg-green-500/20 focus:bg-green-500/20"
                          }
                        >
                          {user.is_admin ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Quitar Admin
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Hacer Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/20" />
                        <DropdownMenuItem
                          onClick={() => handleToggleBan(user.id, user.username || user.email)}
                          className={user.is_banned 
                            ? "hover:bg-green-500/20 focus:bg-green-500/20" 
                            : "hover:bg-red-500/20 focus:bg-red-500/20"
                          }
                        >
                          {user.is_banned ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Desbanear
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Banear
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUserSelect(user.id)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Ver Perfil
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id, user.username || user.email)}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      <Key className="w-4 h-4 mr-1" />
                      Cambiar Contraseña
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRole(user.id, user.is_admin || false)}
                      className={user.is_admin 
                        ? "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20" 
                        : "border-green-500/30 text-green-300 hover:bg-green-500/20"
                      }
                    >
                      {user.is_admin ? (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          Quitar Admin
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Hacer Admin
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleBan(user.id, user.username || user.email)}
                      className={user.is_banned 
                        ? "border-green-500/30 text-green-300 hover:bg-green-500/20" 
                        : "border-red-500/30 text-red-300 hover:bg-red-500/20"
                      }
                    >
                      {user.is_banned ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Desbanear
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-1" />
                          Banear
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-base md:text-lg">No se encontraron usuarios</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      {showBanDialog && selectedUserId && (
        <BanUserDialog
          isOpen={showBanDialog}
          onClose={handleBanDialogClose}
          userId={selectedUserId}
          username={selectedUsername}
          isCurrentlyBanned={users.find(u => u.id === selectedUserId)?.is_banned || false}
          onBanComplete={toggleUserBan}
        />
      )}

      {/* Reset Password Dialog */}
      {showResetPasswordDialog && selectedUserId && (
        <ResetPasswordDialog
          isOpen={showResetPasswordDialog}
          onClose={handleResetPasswordDialogClose}
          userId={selectedUserId}
          username={selectedUsername}
        />
      )}
    </div>
  );
};
