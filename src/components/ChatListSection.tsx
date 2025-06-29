
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Clock } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ChatListSectionProps {
  onSelectChat: (userId: string) => void;
}

interface ConversationWithProfile {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  otherUser: {
    id: string;
    username: string;
    avatar_url: string;
  };
  lastMessage?: {
    content: string;
    sender_id: string;
  };
}

export const ChatListSection = ({ onSelectChat }: ChatListSectionProps) => {
  const [conversationsWithProfiles, setConversationsWithProfiles] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { conversations, unreadCounts, loadConversations, subscribeToConversations } = useMessaging();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Set up realtime subscription for conversations
  useEffect(() => {
    if (!user) return;

    const channel = subscribeToConversations();
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    if (conversations.length > 0) {
      loadConversationProfiles();
    } else {
      setLoading(false);
    }
  }, [conversations]);

  const loadConversationProfiles = async () => {
    const conversationsWithProfilesData: ConversationWithProfile[] = [];

    for (const conversation of conversations) {
      const otherUserId = conversation.user1_id === user?.id ? conversation.user2_id : conversation.user1_id;
      
      try {
        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, sender_id')
          .or(`and(sender_id.eq.${conversation.user1_id},receiver_id.eq.${conversation.user2_id}),and(sender_id.eq.${conversation.user2_id},receiver_id.eq.${conversation.user1_id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (profile) {
          conversationsWithProfilesData.push({
            ...conversation,
            otherUser: profile,
            lastMessage: lastMessage || undefined
          });
        }
      } catch (error) {
        console.error('Error loading conversation profile:', error);
      }
    }

    setConversationsWithProfiles(conversationsWithProfilesData);
    setLoading(false);
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Cargando conversaciones...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Chats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversationsWithProfiles.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No tienes conversaciones</p>
              <p className="text-sm">Empieza a chatear con otros usuarios desde sus perfiles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversationsWithProfiles.map((conversation) => {
                const unreadCount = unreadCounts[conversation.otherUser.id] || 0;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => onSelectChat(conversation.otherUser.id)}
                    className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10 hover:border-white/20 relative"
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.otherUser.avatar_url} />
                        <AvatarFallback className="bg-purple-500/20 text-white">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600 min-w-[1.5rem]"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium truncate">
                          {conversation.otherUser.username || 'Usuario'}
                        </h3>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatLastMessageTime(conversation.last_message_at)}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <div className="text-gray-300 text-sm truncate mt-1">
                          {conversation.lastMessage.sender_id === user?.id ? 'Tú: ' : ''}
                          {conversation.lastMessage.content}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-gray-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
