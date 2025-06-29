import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { VideoComments } from "@/components/VideoComments";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    duration: string | null;
    views: number;
    likes: number;
    comments: number;
    created_at: string;
    product_id: string | null;
  };
  onPlay: (video: any) => void;
}

export const VideoCard = ({ video, onPlay }: VideoCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay(video);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 group overflow-hidden">
      <div className="relative">
        {/* Video Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative overflow-hidden">
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-white/50" />
            </div>
          )}
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4"
              onClick={handlePlay}
            >
              <Play className="w-8 h-8 text-white fill-white" />
            </Button>
          </div>

          {/* Duration Badge */}
          {video.duration && (
            <Badge className="absolute bottom-2 right-2 bg-black/60 text-white border-none">
              {video.duration}
            </Badge>
          )}
        </div>

        {/* Video Info */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Title */}
            <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">
              {video.title}
            </h3>

            {/* Description */}
            {video.description && (
              <p className="text-gray-300 text-sm line-clamp-2">
                {video.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatViews(video.views)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{video.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{video.comments}</span>
                </div>
              </div>
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              
              {video.product_id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  Ver Producto
                </Button>
              )}
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <VideoComments videoId={parseInt(video.id)} />
          )}
        </CardContent>
      </div>
    </Card>
  );
};
