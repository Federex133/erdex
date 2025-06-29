
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ProductComment {
  id: string;
  user_id: string;
  product_id: string;
  comment: string;
  rating: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  } | null;
}

export const useProductComments = (productId: string) => {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar comentarios del producto
  const fetchComments = async () => {
    try {
      // Primero intentar con la relación profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Si tenemos comentarios, intentar obtener los perfiles por separado
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Combinar comentarios con perfiles
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesData?.find(profile => profile.id === comment.user_id) || null
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      });
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo comentario
  const createComment = async (comment: string, rating: number = 5) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para comentar",
        variant: "destructive",
      });
      return { error: new Error('User not authenticated') };
    }

    try {
      // Insertar el comentario
      const { data: newComment, error: insertError } = await supabase
        .from('product_comments')
        .insert([{
          product_id: productId,
          user_id: user.id,
          comment,
          rating,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Obtener el perfil del usuario para el comentario
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      // Crear el comentario completo con el perfil
      const commentWithProfile = {
        ...newComment,
        profiles: userProfile || null
      };

      // Actualizar lista local
      setComments(prev => [commentWithProfile, ...prev]);

      toast({
        title: "¡Comentario publicado!",
        description: "Tu comentario ha sido publicado exitosamente",
      });

      return { data: commentWithProfile, error: null };
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Eliminar comentario
  const deleteComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para eliminar comentarios",
        variant: "destructive",
      });
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error: deleteError } = await supabase
        .from('product_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Asegurar que solo elimine sus propios comentarios

      if (deleteError) throw deleteError;

      // Actualizar lista local
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      toast({
        title: "Comentario eliminado",
        description: "Tu comentario ha sido eliminado exitosamente",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    if (productId) {
      fetchComments();
    }
  }, [productId]);

  return {
    comments,
    loading,
    createComment,
    deleteComment,
    refreshComments: fetchComments,
  };
};
