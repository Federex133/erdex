
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageCircle, AlertTriangle, Trash2, Bell, BellOff } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useMessaging } from "@/hooks/useMessaging";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { containsBannedWords } from "@/utils/messageCensor";

interface ChatSectionProps {
  otherUserId: string;
  onBack: () => void;
}

export const ChatSection = ({ otherUserId, onBack }: ChatSectionProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showCensorWarning, setShowCensorWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteMessage, loadMessages, subscribeToMessages } = useMessaging();
  const { profile, fetchUserProfile } = useUserProfile();
  const { permission, requestPermission, isSupported } = useNotifications();

  useEffect(() => {
    console.log('ChatSection mounted, otherUserId:', otherUserId);
    if (otherUserId) {
      fetchUserProfile(otherUserId);
      loadMessages(otherUserId);
    }
  }, [otherUserId]);

  // Solicitar permisos de notificación al montar el componente
  useEffect(() => {
    if (isSupported && permission === 'default') {
      console.log('Auto-requesting notification permission');
      requestPermission();
    }
  }, [isSupported, permission]);

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!otherUserId || !user) {
      console.log('Not setting up subscription - missing otherUserId or user');
      return;
    }

    console.log('Setting up realtime subscription for chat with:', otherUserId);
    const channel = subscribeToMessages(otherUserId);
    
    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        channel.unsubscribe();
      }
    };
  }, [otherUserId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Verificar si el mensaje contiene palabras prohibidas
  useEffect(() => {
    if (newMessage.trim()) {
      const hasBannedWords = containsBannedWords(newMessage);
      setShowCensorWarning(hasBannedWords);
    } else {
      setShowCensorWarning(false);
    }
  }, [newMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    console.log('Sending message:', newMessage);
    const success = await sendMessage(otherUserId, newMessage);
    if (success) {
      setNewMessage("");
      setShowCensorWarning(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    console.log('Deleting message:', messageId);
    await deleteMessage(messageId);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleNotifications = () => {
    if (permission === 'granted') {
      // No podemos desactivar notificaciones programáticamente
      alert('Para desactivar las notificaciones, hazlo desde la configuración de tu navegador');
    } else {
      requestPermission();
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack} className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center text-white">Cargando chat...</div>
      </div>
    );
  }

  console.log('Rendering ChatSection with', messages.length, 'messages');

  return (
    <div className="h-screen flex flex-col" style={{
      backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {profile.background_url && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}
      
      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-purple-500/20 text-white">
                  <MessageCircle className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-white">{profile.username || 'Usuario'}</h1>
                <p className="text-gray-300 text-sm">Chat privado • En tiempo real</p>
              </div>
            </div>
            {/* Botón para controlar notificaciones */}
            {isSupported && (
              <Button
                variant="outline"
                onClick={handleToggleNotifications}
                className={`border-white/20 text-white hover:bg-white/10 ml-auto ${
                  permission === 'granted' ? 'bg-green-500/20 border-green-500/30' : ''
                }`}
              >
                {permission === 'granted' ? (
                  <>
                    <Bell className="w-4 h-4 mr-2 text-green-400" />
                    Notificaciones ON
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Activar notificaciones
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Chat Container - Takes remaining height */}
        <div className="flex-1 p-4 pt-0 overflow-hidden">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex flex-col">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversación con {profile.username || 'Usuario'}
                {permission === 'granted' && (
                  <span className="text-green-400 text-sm ml-2">🔔</span>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
              {/* Messages Area - Scrollable with fixed height */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Aún no hay mensajes</p>
                    <p className="text-sm">Envía el primer mensaje para comenzar la conversación</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender_id === user?.id ? (
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <div
                              className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                              <p className="break-words">{message.content}</p>
                              <p className="text-xs mt-1 text-blue-100">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="bg-gray-800 border-gray-700">
                            <ContextMenuItem 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar mensaje
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ) : (
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white/20 text-white border border-white/20">
                          <p className="break-words">{message.content}</p>
                          <p className="text-xs mt-1 text-gray-300">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="flex-shrink-0 border-t border-white/10 pt-4">
                {showCensorWarning && (
                  <div className="mb-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-200 text-sm">
                      Tu mensaje contiene palabras inapropiadas que serán censuradas automáticamente.
                    </span>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className={`flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 ${
                      showCensorWarning ? 'border-yellow-500/50' : ''
                    }`}
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
