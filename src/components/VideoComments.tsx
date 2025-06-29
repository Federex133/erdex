
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  content: string;
  likes: number;
  timestamp: string;
  avatar: string;
}

interface VideoCommentsProps {
  videoId: number;
}

export const VideoComments = ({ videoId }: VideoCommentsProps) => {
  const [newComment, setNewComment] = useState("");

  // Datos de ejemplo de comentarios
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: "MaríaDesign",
      content: "¡Increíble producto! Lo compré y vale la pena cada peso 🔥",
      likes: 12,
      timestamp: "hace 2h",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      author: "DevCarlos",
      content: "Excelente calidad, muy recomendado para proyectos profesionales",
      likes: 8,
      timestamp: "hace 5h",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      author: "UXSofia",
      content: "¿Incluye archivos editables? Me interesa mucho",
      likes: 3,
      timestamp: "hace 1d",
      avatar: "/placeholder.svg"
    }
  ]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: comments.length + 1,
        author: "Tú",
        content: newComment,
        likes: 0,
        timestamp: "ahora",
        avatar: "/placeholder.svg"
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

  const handleLikeComment = (commentId: number) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    ));
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <h4 className="text-white text-sm font-medium mb-3">Comentarios</h4>
      
      {/* Add Comment */}
      <div className="flex space-x-2 mb-4">
        <Input
          placeholder="Añade un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-xs"
          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
        />
        <Button 
          size="sm" 
          onClick={handleAddComment}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs px-3"
        >
          Enviar
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">{comment.author[0]}</span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-white text-xs font-medium">{comment.author}</span>
                <span className="text-gray-400 text-[10px]">{comment.timestamp}</span>
              </div>
              <p className="text-gray-300 text-xs">{comment.content}</p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10 p-1 h-auto"
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="ml-1 text-[10px]">{comment.likes}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
