import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
}

export const useUserSearch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    if (searchTerm.length < 2) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, avatar_url, created_at')
        .ilike('username', `%${searchTerm}%`)
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron buscar usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearUsers = () => {
    setUsers([]);
  };

  return {
    users,
    loading,
    searchUsers,
    clearUsers,
  };
};
