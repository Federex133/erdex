
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  User,
  Send,
  ArrowLeft,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useVideoLikes } from "@/hooks/useVideoLikes";
import { useVideoComments } from "@/hooks/useVideoComments";
import { useVideos, Video } from "@/hooks/useVideos";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

interface RandomVideosViewerProps {
  onBack: () => void;
  onUserSelect: (userId: string) => void;
}

export const RandomVideosViewer = ({ onBack, onUserSelect }: RandomVideosViewerProps) => {
  const { videos, incrementViews } = useVideos();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [hasIncrementedViews, setHasIncrementedViews] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];
  const { isLiked, likesCount, toggleLike } = useVideoLikes(currentVideo?.id || '');
  const { comments, addComment } = useVideoComments(currentVideo?.id || '');
  const { fetchUserProfile } = useUserProfile();

  // Cargar perfil del usuario actual
  useEffect(() => {
    if (currentVideo && !userProfiles[currentVideo.user_id]) {
      fetchUserProfile(currentVideo.user_id).then(() => {
        // El perfil se carga en el hook useUserProfile pero necesitamos acceso local
        // Aquí simplemente almacenamos que ya se cargó
        setUserProfiles(prev => ({
          ...prev,
          [currentVideo.user_id]: true
        }));
      });
    }
  }, [currentVideo?.user_id]);

  // Auto-reproducir video cuando cambia
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
      
      if (!hasIncrementedViews.has(currentVideo.id)) {
        incrementViews(currentVideo.id);
        setHasIncrementedViews(prev => new Set([...prev, currentVideo.id]));
      }
    }
  }, [currentIndex, currentVideo?.id]);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(newComment);
      setNewComment("");
    }
  };

  const handleUserClick = () => {
    if (currentVideo) {
      onUserSelect(currentVideo.user_id);
    }
  };

  // Manejar gestos de scroll/swipe
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') goToPrevious();
      if (e.key === 'ArrowDown') goToNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, videos.length]);

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">No hay videos disponibles</h2>
          <Button onClick={onBack} variant="outline" className="text-white border-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Contador de videos */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      </div>

      {/* Video principal */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src={currentVideo.video_url || undefined}
          poster={currentVideo.thumbnail_url || undefined}
          className="w-full h-full object-contain"
          loop
          playsInline
          muted={isMuted}
          onClick={() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause()}
        />

        {/* Controles laterales */}
        <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-10">
          {/* Avatar del usuario */}
          <div className="flex flex-col items-center">
            <Avatar 
              className="w-12 h-12 border-2 border-white cursor-pointer hover:scale-110 transition-transform"
              onClick={handleUserClick}
            >
              <AvatarFallback className="bg-purple-500/80 text-white">
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Botón de like */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLike}
              className={`${
                isLiked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-white hover:text-red-400'
              } p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-white text-sm mt-1 font-semibold">{likesCount}</span>
          </div>

          {/* Botón de comentarios */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-white hover:text-blue-400 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <span className="text-white text-sm mt-1 font-semibold">{comments.length}</span>
          </div>

          {/* Botón de compartir */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:text-green-400 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all"
          >
            <Share2 className="w-6 h-6" />
          </Button>

          {/* Botón de sonido */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-white hover:text-yellow-400 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>
        </div>

        {/* Navegación vertical */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="text-white hover:text-blue-400 p-2 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-30"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
            className="text-white hover:text-blue-400 p-2 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-30"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Información del video */}
        <div className="absolute bottom-20 left-4 right-20 z-10">
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-lg">{currentVideo.title}</h3>
            {currentVideo.description && (
              <p className="text-gray-300 text-sm">{currentVideo.description}</p>
            )}
            <p className="text-gray-400 text-xs">
              {currentVideo.views.toLocaleString()} vistas
            </p>
          </div>
        </div>
      </div>

      {/* Panel de comentarios */}
      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 max-h-96 overflow-hidden z-20">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-semibold">Comentarios ({comments.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            {user && (
              <div className="flex space-x-2">
                <Input
                  placeholder="Añade un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No hay comentarios aún</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback className="bg-purple-500/20 text-white text-xs">
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-medium">Usuario</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
