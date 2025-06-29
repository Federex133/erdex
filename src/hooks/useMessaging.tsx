import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { censorMessage } from '@/utils/messageCensor';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
}

export const useMessaging = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return false;

    setLoading(true);
    try {
      // Censurar el mensaje antes de enviarlo
      const censoredContent = censorMessage(content.trim());
      
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: receiverId,
            content: censoredContent
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id); // Solo permitir eliminar mensajes propios

      if (error) throw error;

      // Actualizar el estado local para eliminar el mensaje
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      console.log('Message deleted successfully:', messageId);
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje ha sido eliminado correctamente",
      });
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      });
      return false;
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Messages loaded:', data);
      setMessages(data || []);
      
      // Mark all messages from this user as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          msg.receiver_id === user.id && 
          msg.sender_id === otherUserId && 
          !msg.read_at
        );
        
        for (const message of unreadMessages) {
          await markAsRead(message.id);
        }
        
        // Update unread count for this conversation
        setUnreadCounts(prev => ({
          ...prev,
          [otherUserId]: 0
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('receiver_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const loadUnreadCounts = async () => {
    if (!user) return;

    try {
      // Get all conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (conversationsError) throw conversationsError;

      const counts: Record<string, number> = {};

      // For each conversation, count unread messages
      for (const conversation of conversationsData || []) {
        const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
        
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', otherUserId)
          .eq('receiver_id', user.id)
          .is('read_at', null);

        if (error) {
          console.error('Error counting unread messages:', error);
          continue;
        }

        counts[otherUserId] = count || 0;
      }

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      
      // Load unread counts after loading conversations
      await loadUnreadCounts();
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = (otherUserId: string) => {
    if (!user) return null;

    console.log('Setting up realtime subscription for messages with user:', otherUserId);

    const channel = supabase
      .channel(`messages-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received via realtime:', payload);
          const newMessage = payload.new as Message;
          
          // Only add message if it's part of this conversation
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === user.id)
          ) {
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              console.log('Adding new message to conversation:', newMessage);
              return [...prev, newMessage];
            });

            // If the message is from the other user and we're in the chat, mark it as read
            if (newMessage.sender_id === otherUserId && newMessage.receiver_id === user.id) {
              markAsRead(newMessage.id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated via realtime:', payload);
          const updatedMessage = payload.new as Message;
          
          // Only update if it's part of this conversation
          if (
            (updatedMessage.sender_id === user.id && updatedMessage.receiver_id === otherUserId) ||
            (updatedMessage.sender_id === otherUserId && updatedMessage.receiver_id === user.id)
          ) {
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message deleted via realtime:', payload);
          const deletedMessage = payload.old as Message;
          
          // Remove the deleted message from the local state
          if (
            (deletedMessage.sender_id === user.id && deletedMessage.receiver_id === otherUserId) ||
            (deletedMessage.sender_id === otherUserId && deletedMessage.receiver_id === user.id)
          ) {
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status:', status);
      });

    return channel;
  };

  const subscribeToConversations = () => {
    if (!user) return null;

    console.log('Setting up realtime subscription for conversations');

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation updated via realtime:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newConversation = payload.new as Conversation;
            // Only add if user is part of this conversation
            if (newConversation.user1_id === user.id || newConversation.user2_id === user.id) {
              setConversations(prev => {
                const exists = prev.some(conv => conv.id === newConversation.id);
                if (exists) return prev;
                return [newConversation, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedConversation = payload.new as Conversation;
            // Only update if user is part of this conversation
            if (updatedConversation.user1_id === user.id || updatedConversation.user2_id === user.id) {
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === updatedConversation.id ? updatedConversation : conv
                ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message for unread count:', payload);
          const newMessage = payload.new as Message;
          
          // If this is a message TO the current user, update unread count
          if (newMessage.receiver_id === user.id && !newMessage.read_at) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated for unread count:', payload);
          const updatedMessage = payload.new as Message;
          const oldMessage = payload.old as Message;
          
          // If a message was marked as read, update unread count
          if (updatedMessage.receiver_id === user.id && !oldMessage.read_at && updatedMessage.read_at) {
            setUnreadCounts(prev => ({
              ...prev,
              [updatedMessage.sender_id]: Math.max(0, (prev[updatedMessage.sender_id] || 1) - 1)
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Conversation subscription status:', status);
      });

    return channel;
  };

  return {
    messages,
    conversations,
    unreadCounts,
    loading,
    sendMessage,
    deleteMessage,
    loadMessages,
    markAsRead,
    loadConversations,
    subscribeToMessages,
    subscribeToConversations,
  };
};
