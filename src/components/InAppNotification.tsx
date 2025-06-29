
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";

interface InAppNotificationProps {
  isVisible: boolean;
  senderAvatar?: string;
  senderUsername: string;
  message: string;
  onHide: () => void;
}

export const InAppNotification = ({ 
  isVisible, 
  senderAvatar, 
  senderUsername, 
  message, 
  onHide 
}: InAppNotificationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300); // Wait for animation to complete
      }, 1000); // Show for 1 second

      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible && !show) return null;

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]
      transition-all duration-300 ease-in-out
      ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
    `}>
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-lg shadow-xl p-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback className="bg-purple-500/20 text-purple-700">
              <MessageCircle className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">
                {senderUsername}
              </span>
              <span className="text-xs text-gray-500">💬</span>
            </div>
            <p className="text-sm text-gray-700 truncate mt-1">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
