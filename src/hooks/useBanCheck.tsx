import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BanStatus {
  is_banned: boolean;
  reason?: string;
  banned_until?: string;
}

export const useBanCheck = () => {
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  const checkBanStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('check_user_ban_status', { user_id: user.id });

      if (error) {
        console.error('Error checking ban status:', error);
        setBanStatus(null);
      } else {
        const newBanStatus = data?.[0] || { is_banned: false };
        setBanStatus(newBanStatus);
        
        // Show notification if user is banned
        if (newBanStatus.is_banned) {
          toast({
            title: "Cuenta suspendida",
            description: `Tu cuenta ha sido suspendida: ${newBanStatus.reason}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
      setBanStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription for ban status
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for ban status');
    
    // Clean up any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing ban status channel');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create channel for ban status
    channelRef.current = supabase
      .channel(`ban-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_bans',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('User banned via realtime:', payload);
          const newBan = payload.new;
          
          const newBanStatus = {
            is_banned: true,
            reason: newBan.reason,
            banned_until: newBan.banned_until,
          };
          
          setBanStatus(newBanStatus);
          
          // Show immediate notification
          toast({
            title: "Cuenta suspendida",
            description: `Tu cuenta ha sido suspendida: ${newBan.reason}`,
            variant: "destructive",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_bans',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('User unbanned via realtime:', payload);
          
          const newBanStatus = {
            is_banned: false,
            reason: undefined,
            banned_until: undefined,
          };
          
          setBanStatus(newBanStatus);
          
          // Show immediate notification
          toast({
            title: "Cuenta restaurada",
            description: "Tu cuenta ha sido restaurada. Ya puedes acceder a la plataforma.",
          });
        }
      )
      .subscribe((status) => {
        console.log('Ban status subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up ban status subscription');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user, toast]);

  useEffect(() => {
    checkBanStatus();
  }, [user]);

  return { banStatus, loading, refreshBanStatus: checkBanStatus };
};
