import { Home, Compass, Heart, Briefcase, User, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

export type Tab = 'home' | 'explore' | 'favorites' | 'recruitments' | 'messages' | 'profile';

interface BottomNavProps {
  currentTab: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  const { unreadCount } = useAppStore();
  const tabs = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'explore', label: 'Explorer', icon: Compass },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'recruitments', label: 'Emplois', icon: Briefcase },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const hasBadge = tab.id === 'messages' && unreadCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id as Tab)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive ? "text-orange-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6", isActive && "fill-orange-50")} strokeWidth={isActive ? 2.5 : 2} />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-black text-white px-0.5 shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
