import React from 'react';
import { X, Bell, Check, Trash2, Calendar, Sparkles, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function NotificationCenterModal({ isOpen, onClose, onNavigateTab }: NotificationCenterModalProps) {
  const { notifications, markNotificationAsRead, clearAllNotifications, currentUser } = useAppStore();

  if (!isOpen) return null;

  // Filter notifications for current user or general
  const userNotifications = notifications.filter(
    n => !n.userId || n.userId === currentUser?.id || currentUser?.role === 'admin'
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleItemClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab && onNavigateTab) {
      onNavigateTab(notif.linkTab);
    }
    onClose();
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'manager_invite':
        return <Sparkles size={18} className="text-amber-500" />;
      case 'reservation_update':
        return <Calendar size={18} className="text-emerald-500" />;
      case 'friend_request':
        return <UserPlus size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-orange-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-xl relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">Centre de Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes vos notifications sont à jour'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        {userNotifications.length > 0 && (
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <button
              onClick={() => markNotificationAsRead()}
              className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>Tout marquer comme lu</span>
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-gray-400 hover:text-red-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              <span>Effacer tout</span>
            </button>
          </div>
        )}

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {userNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <Bell size={24} />
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Aucune notification pour le moment.</p>
              <p className="text-[11px] text-gray-400">Vous recevrez ici les réponses des gérants, confirmations et invitations.</p>
            </div>
          ) : (
            userNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start relative ${
                  notif.read 
                    ? 'bg-gray-50/60 dark:bg-gray-950/40 border-gray-100 dark:border-gray-800 opacity-80' 
                    : 'bg-orange-50/50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40 shadow-2xs'
                }`}
              >
                <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xs mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-snug">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
