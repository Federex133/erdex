
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useVideoLikes = (videoId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkIfLiked = async () => {
    if (!user || !videoId) return;

    try {
      const { data, error } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const getLikesCount = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      setLikesCount(data?.likes || 0);
    } catch (error) {
      console.error('Error getting likes count:', error);
    }
  };

  const toggleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from('video_likes')
          .insert([{
            video_id: videoId,
            user_id: user.id,
          }]);

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el like",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      checkIfLiked();
      getLikesCount();
    }
  }, [videoId, user]);

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
  };
};
