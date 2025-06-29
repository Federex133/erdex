import { Navbar } from "@/components/Navbar";
import { ProductsSection } from "@/components/ProductsSection";
import { SalesSection } from "@/components/SalesSection";
import { ProfileSection } from "@/components/ProfileSection";
import { TopSellersSection } from "@/components/TopSellersSection";
import { VideosSection } from "@/components/VideosSection";
import { MyProductsSection } from "@/components/MyProductsSection";
import { MyVideosSection } from "@/components/MyVideosSection";
import { AdminSection } from "@/components/AdminSection";
import { UserProfileSection } from "@/components/UserProfileSection";
import { UserSearchSection } from "@/components/UserSearchSection";
import { ChatSection } from "@/components/ChatSection";
import { ChatListSection } from "@/components/ChatListSection";
import { CartSection } from "@/components/CartSection";
import { AuthModal } from "@/components/AuthModal";
import { BannedUserModal } from "@/components/BannedUserModal";
import { InAppNotification } from "@/components/InAppNotification";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useBanCheck } from "@/hooks/useBanCheck";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";

const AppContent = () => {
  const [activeSection, setActiveSection] = useState("products");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { banStatus, loading: banLoading } = useBanCheck();
  const { fetchUserProfile } = useUserProfile();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();
  const { notification, isVisible, showNotification: showInAppNotification, hideNotification } = useInAppNotifications();
  const channelRef = useRef<any>(null);

  // Single consolidated global message subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up consolidated global message subscription');
    
    // Auto-request notification permission
    if (isSupported && permission === 'default') {
      console.log('Auto-requesting notification permission');
      requestPermission();
    }

    // Clean up any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing channel');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create single channel for global messages
    channelRef.current = supabase
      .channel(`global-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New message received globally:', payload);
          const newMessage = payload.new;
          
          // Only show notification if we're not currently in a chat with this person
          if (activeSection !== 'chat' || chatUserId !== newMessage.sender_id) {
            // Fetch sender profile for notification
            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', newMessage.sender_id)
                .single();

              if (senderProfile) {
                // Show browser notification
                showNotification(
                  `Nuevo mensaje de ${senderProfile.username || 'Usuario'}`,
                  {
                    body: newMessage.content,
                    tag: `message-${newMessage.id}`,
                    requireInteraction: false
                  }
                );

                // Show in-app notification
                showInAppNotification({
                  senderAvatar: senderProfile.avatar_url,
                  senderUsername: senderProfile.username || 'Usuario',
                  message: newMessage.content,
                });
              }
            } catch (error) {
              console.error('Error fetching sender profile for notification:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Global message subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up global message subscription');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user, activeSection, chatUserId, showNotification, showInAppNotification, isSupported, permission, requestPermission]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setActiveSection("user-profile");
  };

  const handleBackFromProfile = () => {
    setSelectedUserId(null);
    setActiveSection("products");
  };

  const handleStartChat = (userId: string) => {
    setChatUserId(userId);
    setActiveSection("chat");
  };

  const handleBackFromChat = () => {
    setChatUserId(null);
    if (selectedUserId) {
      setActiveSection("user-profile");
    } else {
      setActiveSection("chats");
    }
  };

  const handleSelectChatFromList = (userId: string) => {
    setChatUserId(userId);
    setSelectedUserId(null);
    setActiveSection("chat");
  };

  const handleBackFromCart = () => {
    setActiveSection("products");
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "products":
        return <ProductsSection onUserSelect={handleUserSelect} />;
      case "user-search":
        return <UserSearchSection onUserSelect={handleUserSelect} />;
      case "chats":
        return <ChatListSection onSelectChat={handleSelectChatFromList} />;
      case "sales":
        return <SalesSection />;
      case "profile":
        return <ProfileSection onLogout={signOut} />;
      case "top-sellers":
        return <TopSellersSection onUserSelect={handleUserSelect} />;
      case "videos":
        return <VideosSection onUserSelect={handleUserSelect} />;
      case "my-products":
        return <MyProductsSection />;
      case "my-videos":
        return <MyVideosSection />;
      case "admin":
        return isAdmin ? <AdminSection onUserSelect={handleUserSelect} /> : <ProductsSection onUserSelect={handleUserSelect} />;
      case "user-profile":
        return selectedUserId ? (
          <UserProfileSection 
            userId={selectedUserId} 
            onBack={handleBackFromProfile}
            onStartChat={handleStartChat}
          />
        ) : <ProductsSection onUserSelect={handleUserSelect} />;
      case "chat":
        return chatUserId ? (
          <ChatSection 
            otherUserId={chatUserId} 
            onBack={handleBackFromChat}
          />
        ) : <ProductsSection onUserSelect={handleUserSelect} />;
      case "cart":
        return <CartSection onBack={handleBackFromCart} />;
      default:
        return <ProductsSection onUserSelect={handleUserSelect} />;
    }
  };

  if (loading || banLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-black via-brand-gray to-brand-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  // Check if user is banned
  if (banStatus?.is_banned) {
    return (
      <BannedUserModal 
        reason={banStatus.reason}
        bannedUntil={banStatus.banned_until}
      />
    );
  }

  return (
    <>
      {/* Global In-App Notification */}
      {notification && (
        <InAppNotification
          isVisible={isVisible}
          senderAvatar={notification.senderAvatar}
          senderUsername={notification.senderUsername}
          message={notification.message}
          onHide={hideNotification}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-brand-black via-brand-gray to-brand-black">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(255,255,255,.05)_25%,rgba(255,255,255,.05)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.05)_75%,rgba(255,255,255,.05)_76%,transparent_77%,transparent),linear-gradient(rgba(255,255,255,.05)_50%,transparent_50%)] bg-[size:50px_50px]"></div>
        </div>
        <div className="relative z-10">
          <Navbar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
            onLogout={signOut}
            isAdmin={isAdmin}
            onUserSelect={handleUserSelect}
          />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {renderActiveSection()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

const Index = () => {
  return (
    <AppContent />
  );
};

export default Index;
