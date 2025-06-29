import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, ShoppingBag, Heart, TrendingUp, Calendar, Play, Shield, UserPlus, UserMinus, Users, MessageCircle } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserFollow } from "@/hooks/useUserFollow";
import { useAuth } from "@/hooks/useAuth";

interface UserProfileSectionProps {
  userId: string;
  onBack: () => void;
  onStartChat?: (userId: string) => void;
}

export const UserProfileSection = ({
  userId,
  onBack,
  onStartChat
}: UserProfileSectionProps) => {
  const { user: currentUser } = useAuth();
  const {
    profile,
    products,
    stats,
    loading,
    fetchUserProfile
  } = useUserProfile();

  const {
    isFollowing,
    loading: followLoading,
    checkIfFollowing,
    followUser,
    unfollowUser,
  } = useUserFollow();

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
      if (currentUser && currentUser.id !== userId) {
        checkIfFollowing(userId);
      }
    }
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack} className="border-white/20 text-white hover:bg-white/10 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center text-white">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack} className="border-white/20 text-white hover:bg-white/10 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center text-white">Usuario no encontrado</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isAdminUser = profile.email === 'mr.federex@gmail.com';
  const isOwnProfile = currentUser?.id === userId;

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
    fetchUserProfile(userId);
  };

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(userId);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Overlay para mejorar legibilidad */}
      {profile.background_url && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      )}
      
      <div className="relative z-10 p-3 sm:p-4 space-y-3 sm:space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" onClick={onBack} className="border-white/20 text-red-500 bg-black/10 text-xs sm:text-sm md:text-base px-2 sm:px-4">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Volver</span>
          </Button>
          <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-white truncate">Perfil de Usuario</h1>
        </div>

        {/* Banner especial para admin */}
        {isAdminUser && (
          <Card className="bg-gradient-to-r from-green-500/20 via-blue-500/20 to-green-500/20 backdrop-blur-lg border-green-400/30 shadow-lg">
            <CardContent className="p-2 sm:p-3 md:p-4 bg-slate-950">
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" />
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    ADMIN
                  </h2>
                  <p className="text-xs sm:text-sm text-green-300">Administrador del Sistema</p>
                </div>
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video de presentación */}
        {profile.presentation_video_url && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-2 sm:pb-4 md:pb-6">
              <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base md:text-lg">
                <Play className="w-4 h-4 md:w-5 md:h-5" />
                Video de Presentación
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <video 
                src={profile.presentation_video_url} 
                className="w-full max-w-2xl mx-auto rounded-lg" 
                controls 
                preload="metadata" 
              />
            </CardContent>
          </Card>
        )}

        {/* Información del perfil */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col space-y-4">
              {/* Avatar centrado en móvil */}
              <div className="flex justify-center sm:justify-start">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-purple-500/20 text-white text-base sm:text-lg md:text-2xl">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-3">
                {/* Información básica centrada en móvil */}
                <div className="text-center sm:text-left space-y-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white break-words">
                    {profile.username || 'Usuario'}
                  </h2>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base break-all">
                    Usuario desde {new Date(profile.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                
                {/* Botones de seguir y chat - ancho completo en móvil */}
                {!isOwnProfile && currentUser && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex-1 sm:flex-none text-xs sm:text-sm ${
                        isFollowing 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {followLoading ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : isFollowing ? (
                        <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      ) : (
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      )}
                      {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>
                    
                    <Button
                      onClick={handleStartChat}
                      className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Hablar
                    </Button>
                  </div>
                )}
                
                {/* Contadores de seguidores */}
                <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6">
                  <div className="flex items-center gap-1 text-white">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="font-semibold text-xs sm:text-sm md:text-base">{profile.followers_count || 0}</span>
                    <span className="text-gray-300 text-xs sm:text-sm">Seguidores</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="font-semibold text-xs sm:text-sm md:text-base">{profile.following_count || 0}</span>
                    <span className="text-gray-300 text-xs sm:text-sm">Siguiendo</span>
                  </div>
                </div>
                
                {profile.description && (
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base text-center sm:text-left break-words leading-relaxed">
                    {profile.description}
                  </p>
                )}
                
                <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">Miembro desde {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-gray-300 text-xs sm:text-sm font-medium">Ventas</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalSales}</p>
                </div>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400 mx-auto sm:mx-0 mt-1 sm:mt-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-gray-300 text-xs sm:text-sm font-medium">Productos</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalProducts}</p>
                </div>
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400 mx-auto sm:mx-0 mt-1 sm:mt-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-gray-300 text-xs sm:text-sm font-medium">Likes</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.totalLikes}</p>
                </div>
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-400 mx-auto sm:mx-0 mt-1 sm:mt-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos públicos */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="pb-2 sm:pb-4 md:pb-6">
            <CardTitle className="text-white text-sm sm:text-base md:text-lg">Productos Públicos</CardTitle>
            <CardDescription className="text-gray-300 text-xs sm:text-sm md:text-base">
              Productos disponibles de este usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {products.map(product => (
                  <Card key={product.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2 sm:p-3 md:p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2 text-xs sm:text-sm md:text-base break-words">
                        {product.title}
                      </h3>
                      <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2 break-words">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {product.is_free ? (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                              Gratis
                            </Badge>
                          ) : (
                            <span className="text-sm sm:text-base md:text-lg font-bold text-white">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{product.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{product.sales}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2">
                  No hay productos públicos
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Este usuario aún no ha publicado productos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
