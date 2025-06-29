
import { useState, useCallback } from 'react';

interface NotificationData {
  senderAvatar?: string;
  senderUsername: string;
  message: string;
}

export const useInAppNotifications = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((data: NotificationData) => {
    console.log('Showing in-app notification:', data);
    setNotification(data);
    setIsVisible(true);
  }, []);

  const hideNotification = useCallback(() => {
    console.log('Hiding in-app notification');
    setIsVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);

  return {
    notification,
    isVisible,
    showNotification,
    hideNotification,
  };
};
