
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export const useVideoComments = (videoId: string) => {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    if (!videoId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (comment: string) => {
    if (!user || !videoId) return;

    try {
      const { error } = await supabase
        .from('video_comments')
        .insert([{
          video_id: videoId,
          user_id: user.id,
          comment: comment.trim(),
        }]);

      if (error) throw error;

      toast({
        title: "Comentario añadido",
        description: "Tu comentario se ha publicado correctamente",
      });

      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado correctamente",
      });

      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refreshComments: fetchComments,
  };
};
