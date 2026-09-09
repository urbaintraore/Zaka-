import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Home, Compass, Heart, Briefcase, MessageSquare, User, Sun, Moon, Bell, HelpCircle, Mic } from 'lucide-react';
import { NotificationCenterModal } from './NotificationCenterModal';
import { AnimatePresence, motion } from 'motion/react';

export function DashboardLayout() {
  const { currentUser, theme, toggleTheme, notifications } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Filter notifications for current user or general
  const userNotifications = notifications.filter(
    n => !n.userId || n.userId === currentUser?.id || currentUser?.role === 'admin'
  );
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const handleNavigateTab = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-linear-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform">
              Z
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                Zaka<span className="text-orange-600 dark:text-orange-400">+</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block -mt-1">
                Sorties & Réservations
              </span>
            </div>
          </NavLink>

          {/* Nav Tabs for Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Home size={15} />
              <span>Accueil</span>
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Compass size={15} />
              <span>Explorer</span>
            </NavLink>

            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Heart size={15} />
              <span>Favoris</span>
            </NavLink>

            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Briefcase size={15} />
              <span>Emplois</span>
            </NavLink>

            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <MessageSquare size={15} />
              <span>Messages</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <User size={15} />
              <span>Profil</span>
            </NavLink>

            {currentUser?.role === 'artiste' && (
              <NavLink
                to="/artist-dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Mic size={15} />
                <span>Espace Artiste</span>
              </NavLink>
            )}

            <NavLink
              to="/help"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <HelpCircle size={15} />
              <span>Aide / Support</span>
            </NavLink>
          </nav>

          {/* Right User Bar & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 py-1.5 px-3 rounded-xl border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-bold text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/60 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
            )}

            {/* Aide / Support Quick Access */}
            <NavLink
              to="/help"
              className={({ isActive }) =>
                `p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`
              }
              title="Aide & Support (Pitch Deck)"
            >
              <HelpCircle size={18} />
            </NavLink>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigateTab={handleNavigateTab}
      />

      {/* Main Content Area with fluid motion transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (6 official items) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40 py-2 px-2 shadow-lg">
        <div className="flex items-center justify-around">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <Home size={18} />
            <span>Accueil</span>
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <Compass size={18} />
            <span>Explorer</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <Heart size={18} />
            <span>Favoris</span>
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <Briefcase size={18} />
            <span>Emplois</span>
          </NavLink>

          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <MessageSquare size={18} />
            <span>Messages</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`
            }
          >
            <User size={18} />
            <span>Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
