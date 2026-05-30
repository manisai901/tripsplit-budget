import { Compass, Plus, Settings, User, LogOut, Monitor, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { logout as firebaseLogout } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { UserAvatar } from './Avatar';
import { toast } from 'sonner';

export default function MobileNav() {
  const location = useLocation();
  const { activeTrip } = useTrip();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await firebaseLogout();
      toast.success('Signed out successfully');
    } catch (err: any) {
      toast.error('Failed to sign out');
    }
  };

  const switchAccount = async () => {
    setIsProfileOpen(false);
    try {
      await firebaseLogout();
    } catch (err: any) {
      toast.error('Action failed');
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-4 py-2">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isActive && location.pathname === '/' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {location.pathname === '/' && (
               <motion.div layoutId="nav-indicator" className="absolute top-0 w-8 h-1 rounded-b-full bg-orange-500" />
            )}
            <Compass className="w-6 h-6 mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Explore</span>
          </NavLink>

          <div className="relative -top-5">
             <button 
               className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/30 border-4 border-white dark:border-slate-900 hover:scale-105 active:scale-95 transition-transform"
               onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
             >
                <Plus className="w-6 h-6" />
             </button>
          </div>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${isProfileOpen ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
          </button>
        </div>
      </div>

      {/* Mobile Profile Dialog Bottom Sheet */}
      <AnimatePresence>
        {isProfileOpen && user && (
          <div className="fixed inset-0 z-[100] md:hidden flex items-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full bg-white dark:bg-slate-900 rounded-t-[32px] px-6 pt-6 pb-10 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col items-center"
            >
              {/* Drag indicator */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-6" />

              {/* Close Button */}
              <button 
                onClick={() => setIsProfileOpen(false)} 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              {/* User Avatar */}
              <div className="mb-4">
                <UserAvatar 
                  uid={user.uid}
                  displayName={user.displayName}
                  photoURL={user.photoURL}
                  className="w-20 h-20 text-2xl font-bold border-4 border-slate-100 dark:border-slate-800 shadow-lg"
                />
              </div>

              {/* Details */}
              <h3 className="text-xl font-black text-slate-800 dark:text-white">{user.displayName}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 mb-8">{user.email}</p>

              {/* Actions */}
              <div className="w-full space-y-3.5">
                <button 
                  onClick={switchAccount}
                  className="w-full flex items-center justify-between px-5 h-14 bg-slate-55/15 dark:bg-slate-800/15 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-slate-400" />
                    Switch Account
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alt Profile</span>
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 h-14 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 hover:border-red-500/30 transition-all font-bold text-sm text-red-600 justify-center shadow-lg shadow-red-500/[0.04]"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out of Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
