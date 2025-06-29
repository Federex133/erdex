
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Edit, Trash2, Eye, Heart, MessageSquare, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMyVideos } from "@/hooks/useMyVideos";

export const MyVideosSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { myVideos, loading, deleteVideo } = useMyVideos();

  const filteredVideos = myVideos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalViews = myVideos.reduce((sum, video) => sum + video.views, 0);
  const totalLikes = myVideos.reduce((sum, video) => sum + video.likes, 0);
  const totalComments = myVideos.reduce((sum, video) => sum + video.comments, 0);

  const handleDeleteVideo = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este video?')) {
      await deleteVideo(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Videos</h1>
          <p className="text-gray-300">Gestiona todos los videos promocionales que has creado</p>
        </div>
        <div className="text-center py-12">
          <p className="text-white">Cargando tus videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mis Videos</h1>
        <p className="text-gray-300">Gestiona todos los videos promocionales que has creado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Videos Publicados</p>
                <p className="text-2xl font-bold text-white">{myVideos.length}</p>
              </div>
              <Video className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Total Vistas</p>
                <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Total Likes</p>
                <p className="text-2xl font-bold text-white">{totalLikes.toLocaleString()}</p>
              </div>
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Total Comentarios</p>
                <p className="text-2xl font-bold text-white">{totalComments.toLocaleString()}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Buscar mis videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 group overflow-hidden">
              <CardContent className="p-0">
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 cursor-pointer">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {video.duration || "1:00"}
                  </div>
                  
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant="secondary" 
                      className={`${video.status === 'active' 
                        ? 'bg-green-500/20 text-green-200 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
                      }`}
                    >
                      {video.status === 'active' ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </div>
                  
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 space-y-3">
                  {/* Title and Description */}
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-gray-300 text-xs line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {video.views.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {video.likes}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {video.comments}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500">
                    Creado: {new Date(video.created_at).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-white/20 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-white hover:bg-white/20 text-xs">
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-400 hover:bg-red-500/20 text-xs"
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {myVideos.length === 0 ? "No has creado videos aún" : "No se encontraron videos"}
          </h3>
          <p className="text-gray-400">
            {myVideos.length === 0 
              ? "Crea tu primer video promocional" 
              : "Intenta con otros términos de búsqueda"
            }
          </p>
        </div>
      )}
    </div>
  );
};
