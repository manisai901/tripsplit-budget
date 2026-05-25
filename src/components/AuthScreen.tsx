import { Plane, Globe, Compass, Wallet, AlertCircle, Moon, Sun, MapPin } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-slate-900 transition-colors">
      {/* Travel Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000" 
          alt="Travel adventure"
          className="w-full h-full object-cover"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent dark:from-black/90 dark:via-black/70 dark:to-transparent" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white shadow-lg"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 font-bold text-[10px] uppercase tracking-widest text-white shadow-xl">
            <Compass className="w-3 h-3 text-orange-400" />
            <span>Smart Trip Management</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter mb-6 text-white drop-shadow-lg">
            Split travel <br className="hidden md:block"/> expenses with <br className="hidden md:block"/><span className="text-orange-400">friends</span> in <br className="hidden md:block"/> real time.
          </h1>
          
          <p className="text-base md:text-lg text-slate-200 leading-relaxed mb-8 max-w-sm md:max-w-md font-medium drop-shadow-md">
            The easiest way to track group travel expenses. Avoid the math and focus on the adventure while keeping everybody in sync.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-xl flex items-center gap-3 text-red-100 text-xs font-bold leading-relaxed shadow-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogin}
            className="w-full sm:w-auto group relative flex items-center justify-center gap-4 bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 md:py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Google" />
            <span>Connect with Google to Start</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:flex items-center justify-center"
        >
          {/* Glassmorphism preview card */}
          <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full ml-auto overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
             
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-bold text-white mb-1">Paris 2024</h3>
                   <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>France</span>
                   </div>
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-full text-white text-xs font-bold border border-white/10">
                   € 1,200 Left
                </div>
             </div>

             <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5 text-orange-400" />
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm font-bold text-white">Flights to CDG</p>
                      <p className="text-xs text-slate-400">Paid by Alex</p>
                   </div>
                   <p className="text-sm font-bold text-white">€ 640</p>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-amber-400" />
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm font-bold text-white">Eiffel Tower Tour</p>
                      <p className="text-xs text-slate-400">Paid by You</p>
                   </div>
                   <p className="text-sm font-bold text-white">€ 120</p>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
