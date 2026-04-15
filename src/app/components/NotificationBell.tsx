import React, { useState } from 'react';
import { Bell, Eye, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

interface Notification {
  id: string;
  titre: string;
  contenu: string;
  type: 'info' | 'alerte' | 'urgent' | 'maintenance';
  dateCreation: string;
  isRead: boolean;
  actionReturnId?: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToActualites: () => void;
  onReviewActionReturn?: (actionReturnId: string) => void;
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToActualites,
  onReviewActionReturn,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5); // Afficher les 5 plus récentes

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'alerte':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex justify-between items-center text-white">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-white text-indigo-600">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {notification.titre}
                        </h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {notification.contenu}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getTypeColor(notification.type)}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.dateCreation).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      {notification.actionReturnId && onReviewActionReturn && (
                        <Button
                          size="sm"
                          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReviewActionReturn(notification.actionReturnId!);
                            setIsOpen(false);
                          }}
                        >
                          Examiner
                        </Button>
                      )}
                    </div>
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recentNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 bg-gray-50 flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    onMarkAllAsRead();
                    setIsOpen(false);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  onNavigateToActualites();
                  setIsOpen(false);
                }}
              >
                Voir toutes les actualités
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}