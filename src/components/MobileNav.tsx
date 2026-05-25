import { Compass, Plus, Settings, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { motion } from 'motion/react';

export default function MobileNav() {
  const location = useLocation();
  const { activeTrip } = useTrip();

  return (
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
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Placeholder for actual Create action trigger
           >
              <Plus className="w-6 h-6" />
           </button>
        </div>

        <NavLink 
          to="/profile" // In a real app we might have a profile, or we map to settings
           className="flex flex-col items-center justify-center p-2 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
           onClick={(e) => { e.preventDefault(); alert('Profile dialog coming soon') }}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
        </NavLink>
      </div>
    </div>
  );
}
