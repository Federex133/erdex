import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  User,
  Send,
  Trash2,
  Maximize
} from "lucide-react";
import { useVideoLikes } from "@/hooks/useVideoLikes";
import { useVideoComments } from "@/hooks/useVideoComments";
import { useVideos } from "@/hooks/useVideos";
import { useAuth } from "@/hooks/useAuth";

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    thumbnail_url: string | null;
    user_id: string;
    views: number;
    created_at: string;
  };
  autoplay?: boolean;
}

export const VideoPlayer = ({ video, autoplay = false }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [hasIncrementedViews, setHasIncrementedViews] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { incrementViews } = useVideos();
  const { isLiked, likesCount, toggleLike } = useVideoLikes(video.id);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useVideoComments(video.id);

  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error('Error playing video:', error);
          setHasError(true);
        });
        if (!hasIncrementedViews) {
          incrementViews(video.id);
          setHasIncrementedViews(true);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current && !hasError) {
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

  const handleVideoClick = () => {
    togglePlay();
  };

  const handleVideoError = () => {
    console.error('Video failed to load');
    setHasError(true);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (autoplay && videoRef.current && !hasError) {
      videoRef.current.play().catch((error) => {
        console.error('Autoplay failed:', error);
        setHasError(true);
      });
      setIsPlaying(true);
      if (!hasIncrementedViews) {
        incrementViews(video.id);
        setHasIncrementedViews(true);
      }
    }
  }, [autoplay, hasError]);

  if (!video.video_url || hasError) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
            <p className="text-white text-lg">
              {hasError ? "Error al cargar el video" : "Video no disponible"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className={`relative aspect-video bg-black group ${isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}
        >
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.thumbnail_url || undefined}
            className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'} cursor-pointer`}
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={handleVideoError}
            loop
            playsInline
            preload="metadata"
            muted={isMuted}
          />
          
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 md:p-4"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 md:w-8 md:h-8 text-white" />
              ) : (
                <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
              )}
            </Button>
          </div>

          <div className="absolute top-2 md:top-4 right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="bg-black/50 hover:bg-black/70 text-white p-2"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white p-2"
            >
              <Maximize className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {!isFullscreen && (
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            <div>
              <h3 className="text-white font-semibold text-base md:text-lg mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-gray-300 text-sm">{video.description}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 md:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLike}
                  className={`${
                    isLiked 
                      ? 'text-red-400 hover:text-red-300' 
                      : 'text-gray-400 hover:text-white'
                  } hover:bg-white/10 transition-colors p-2`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{likesCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
                >
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                  <span className="text-sm">{comments.length}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
                >
                  <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
              
              <span className="text-gray-500 text-xs md:text-sm">
                {video.views.toLocaleString()} vistas
              </span>
            </div>

            {showComments && (
              <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-white/10">
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3"
                    >
                      <Send className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-60 overflow-y-auto">
                  {commentsLoading ? (
                    <p className="text-gray-400 text-sm">Cargando comentarios...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay comentarios aún</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-2 md:space-x-3">
                        <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                          <AvatarFallback className="bg-purple-500/20 text-white text-xs">
                            <User className="w-3 h-3 md:w-4 md:h-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-xs md:text-sm font-medium">
                                Usuario
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {user && user.id === comment.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-400 hover:bg-white/10 p-1 h-auto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-xs md:text-sm">{comment.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
