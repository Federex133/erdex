
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  product_id: string | null;
  likes: number;
  comments: number;
  views: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      console.log('Videos fetched successfully:', data?.length || 0);
      setVideos(data || []);
    } catch (err) {
      console.error('Error in fetchVideos:', err);
      setError('Error al cargar videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadVideoFile = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error('No user authenticated for video upload');
      return null;
    }

    try {
      console.log('Starting video upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/videos/${Date.now()}.${fileExt}`;

      console.log('Uploading to storage path:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, data:', data);

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadVideoFile:', error);
      toast({
        title: "Error de subida",
        description: `No se pudo subir el video: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadThumbnail = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error('No user authenticated for thumbnail upload');
      return null;
    }

    try {
      console.log('Starting thumbnail upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/thumbnails/${Date.now()}.${fileExt}`;

      console.log('Uploading thumbnail to storage path:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Thumbnail storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Thumbnail upload successful, data:', data);

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Thumbnail public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadThumbnail:', error);
      toast({
        title: "Error de subida",
        description: `No se pudo subir la portada: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const createVideo = async (videoData: Omit<Video, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'likes' | 'comments' | 'views'>) => {
    if (!user) {
      console.error('No user authenticated for video creation');
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear videos",
        variant: "destructive",
      });
      return { error: 'Not authenticated' };
    }

    try {
      console.log('Creating video with data:', {
        ...videoData,
        user_id: user.id
      });
      
      const insertData = {
        ...videoData,
        user_id: user.id,
        likes: 0,
        comments: 0,
        views: 0
      };

      console.log('Inserting video data:', insertData);

      const { data, error } = await supabase
        .from('videos')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Video created successfully in database:', data);

      toast({
        title: "¡Video creado!",
        description: "Tu video se ha publicado correctamente",
      });

      // Refresh videos list
      await fetchVideos();
      return { data, error: null };
    } catch (error) {
      console.error('Error in createVideo:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el video: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      return { error };
    }
  };

  const incrementViews = async (videoId: string) => {
    try {
      const { data: currentVideo } = await supabase
        .from('videos')
        .select('views')
        .eq('id', videoId)
        .single();

      if (currentVideo) {
        await supabase
          .from('videos')
          .update({ views: currentVideo.views + 1 })
          .eq('id', videoId);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return {
    videos,
    loading,
    error,
    createVideo,
    uploadVideoFile,
    uploadThumbnail,
    incrementViews,
    refreshVideos: fetchVideos,
  };
};
