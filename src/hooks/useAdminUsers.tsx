import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserWithProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  is_banned?: boolean;
  ban_reason?: string;
  banned_until?: string;
  is_admin?: boolean;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, username, avatar_url, created_at, is_admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check ban status for each user
      const usersWithBanStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: banData } = await supabase
            .rpc('check_user_ban_status', { user_id: profile.id });

          const banInfo = banData?.[0];
          return {
            ...profile,
            is_banned: banInfo?.is_banned || false,
            ban_reason: banInfo?.reason,
            banned_until: banInfo?.banned_until,
          };
        })
      );

      setUsers(usersWithBanStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, makeAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: makeAdmin })
        .eq('id', userId);

      if (error) throw error;

      // Update local state immediately for better UX
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_admin: makeAdmin }
          : user
      ));

      return true;
    } catch (error) {
      console.error('Error toggling user role:', error);
      throw error;
    }
  };

  const toggleUserBan = async (userId: string, banned: boolean, reason?: string, isPermanent?: boolean, bannedUntil?: Date) => {
    try {
      if (banned) {
        await banUser(userId, reason || 'Sin motivo especificado', isPermanent || false, bannedUntil);
      } else {
        await unbanUser(userId);
      }
      return true;
    } catch (error) {
      console.error('Error toggling user ban:', error);
      throw error;
    }
  };

  const banUser = async (userId: string, reason: string, isPermanent: boolean = false, bannedUntil?: Date) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          banned_by: (await supabase.auth.getUser()).data.user?.id,
          reason,
          is_permanent: isPermanent,
          banned_until: isPermanent ? null : bannedUntil?.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Usuario baneado",
        description: "El usuario ha sido baneado exitosamente",
      });

      // Update local state immediately for better UX
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_banned: true, 
              ban_reason: reason,
              banned_until: isPermanent ? null : bannedUntil?.toISOString()
            }
          : user
      ));
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: "No se pudo banear al usuario",
        variant: "destructive",
      });
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Usuario desbaneado",
        description: "El usuario ha sido desbaneado exitosamente",
      });

      // Update local state immediately for better UX
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_banned: false, 
              ban_reason: undefined,
              banned_until: undefined
            }
          : user
      ));
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "No se pudo desbanear al usuario",
        variant: "destructive",
      });
    }
  };

  // Setup realtime subscription for user bans
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for user bans');
    
    // Clean up any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing user bans channel');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create channel for user bans
    channelRef.current = supabase
      .channel('realtime-user-bans')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_bans',
        },
        async (payload) => {
          console.log('New ban created via realtime:', payload);
          const newBan = payload.new;
          
          // Update the specific user's ban status
          setUsers(prev => prev.map(user => 
            user.id === newBan.user_id 
              ? { 
                  ...user, 
                  is_banned: true, 
                  ban_reason: newBan.reason,
                  banned_until: newBan.banned_until
                }
              : user
          ));

          // Show notification for new ban
          toast({
            title: "Usuario baneado",
            description: `Se ha baneado a un usuario en tiempo real`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_bans',
        },
        async (payload) => {
          console.log('Ban removed via realtime:', payload);
          const deletedBan = payload.old;
          
          // Update the specific user's ban status
          setUsers(prev => prev.map(user => 
            user.id === deletedBan.user_id 
              ? { 
                  ...user, 
                  is_banned: false, 
                  ban_reason: undefined,
                  banned_until: undefined
                }
              : user
          ));

          // Show notification for unban
          toast({
            title: "Usuario desbaneado",
            description: `Se ha desbaneado a un usuario en tiempo real`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          console.log('Profile updated via realtime:', payload);
          const updatedProfile = payload.new;
          
          // Update the specific user's profile info
          setUsers(prev => prev.map(user => 
            user.id === updatedProfile.id 
              ? { 
                  ...user, 
                  username: updatedProfile.username,
                  email: updatedProfile.email,
                  avatar_url: updatedProfile.avatar_url,
                  is_admin: updatedProfile.is_admin
                }
              : user
          ));
        }
      )
      .subscribe((status) => {
        console.log('User bans subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up user bans subscription');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user, toast]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    banUser,
    unbanUser,
    toggleUserRole,
    toggleUserBan,
    refreshUsers: fetchUsers,
  };
};
