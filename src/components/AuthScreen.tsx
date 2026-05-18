import { Plane, Globe, Compass, Wallet, AlertCircle, Moon, Sun } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface AuthScreenProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function AuthScreen({ theme, setTheme }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain: Please add this domain to your Firebase Authorized Domains list.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#F9FAFB] dark:bg-slate-950 transition-colors">
      {/* Decorative Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          rotate: [0, -45, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-slate-500/5 dark:bg-slate-400/5 blur-[100px]"
      />

      {/* Theme Toggle for AuthScreen */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6 font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">
            <Compass className="w-3 h-3 text-orange-500" />
            <span>Smart Trip Management</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-6 text-slate-900 dark:text-white">
            Mani<span className="text-orange-500"> Traveler</span>.
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-sm md:max-w-md font-medium">
            High-density workspace for tracking group travel expenses. Real-time parity for modern explorers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Global Sync</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Split-Logic</span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogin}
            className="w-full sm:w-auto group relative flex items-center justify-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 md:py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-white dark:bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 dark:invert" alt="Google" />
            <span>Connect with Google</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <div className="aspect-[4/5] rounded-[3rem] stat-gradient p-1 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" 
              alt="Beach paradise"
              className="w-full h-full object-cover rounded-[2.85rem] transform transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
