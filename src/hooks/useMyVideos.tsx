
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Video } from './useVideos';

export const useMyVideos = () => {
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar videos del usuario
  const fetchMyVideos = async () => {
    if (!user) {
      setMyVideos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyVideos(data || []);
    } catch (error) {
      console.error('Error fetching my videos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Actualizar video
  const updateVideo = async (id: string, updates: Partial<Video>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Video actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      await fetchMyVideos(); // Recargar la lista
      return { data, error: null };
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el video",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Eliminar video
  const deleteVideo = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Video eliminado",
        description: "El video se ha eliminado correctamente",
      });

      await fetchMyVideos(); // Recargar la lista
      return { error: null };
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchMyVideos();
  }, [user]);

  return {
    myVideos,
    loading,
    updateVideo,
    deleteVideo,
    refreshMyVideos: fetchMyVideos,
  };
};
