
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useUserFollow = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkIfFollowing = async (targetUserId: string) => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      setIsFollowing(true);
      toast({
        title: "Usuario seguido",
        description: "Ahora sigues a este usuario",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "No se pudo seguir al usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setIsFollowing(false);
      toast({
        title: "Usuario no seguido",
        description: "Ya no sigues a este usuario",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "No se pudo dejar de seguir al usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    loading,
    checkIfFollowing,
    followUser,
    unfollowUser,
  };
};
