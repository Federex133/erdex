
import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('Notification permission status:', Notification.permission);
    } else {
      console.log('Notifications not supported in this browser');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      console.log('Requesting notification permission...');
      const result = await Notification.requestPermission();
      console.log('Permission result:', result);
      setPermission(result);
      return result;
    }
    console.log('Notifications not supported');
    return 'denied';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    console.log('Attempting to show notification:', { title, permission, hidden: document.hidden });
    
    if ('Notification' in window && permission === 'granted') {
      // Crear notificación siempre, no solo cuando la ventana está oculta
      // para que el usuario pueda ver que funciona
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'chat-message', // Evita notificaciones duplicadas
        requireInteraction: false,
        ...options
      });

      console.log('Notification created successfully');

      // Auto cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Agregar evento de click para enfocar la ventana
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } else {
      console.log('Cannot show notification:', { 
        hasNotificationAPI: 'Notification' in window,
        permission,
        windowHidden: document.hidden 
      });
    }
    return null;
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
};
