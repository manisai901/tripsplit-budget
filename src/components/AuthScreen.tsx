import { Plane, Globe, Compass, Wallet, AlertCircle, Moon, Sun, MapPin, BookOpen, ShieldCheck, CheckCircle, Mail, Github, Twitter, Shield } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface AuthScreenProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function AuthScreen({ theme, setTheme }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Monitor and tick active countdowns
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleLogin = async () => {
    if (cooldownRemaining > 0) {
      setError(`Auth system is rate-limited. Please wait ${cooldownRemaining}s before attempting to sign in.`);
      return;
    }

    try {
      setError(null);
      const now = Date.now();
      const rawAttempts = localStorage.getItem('traveler_login_attempts');
      let attempts: number[] = rawAttempts ? JSON.parse(rawAttempts) : [];

      // Filter out stamps older than 60 seconds
      attempts = attempts.filter(t => now - t < 60000);

      if (attempts.length >= 3) {
        const backoffLimit = 15; // 15 seconds rate limit block
        setCooldownRemaining(backoffLimit);
        setError(`Too many authentication requests. Rate limit triggered. Please wait ${backoffLimit}s before retrying.`);
        return;
      }

      attempts.push(now);
      localStorage.setItem('traveler_login_attempts', JSON.stringify(attempts));

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
    <div className="min-h-screen relative bg-slate-900 transition-colors flex flex-col overflow-y-auto">
      {/* Travel Hero Splash Screen */}
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
        {/* Travel Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000" 
            alt="Travel adventure"
            className="w-full h-full object-cover"
          />
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-slate-950" />
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

        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10 my-12">
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

      {/* SEO Publisher Content: App Features Deep-Dive */}
      <div className="relative z-10 w-full bg-slate-950 text-slate-100 border-t border-slate-800 py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          <section className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Engineered for Seamless Shared Travel
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
              Take the stress out of holiday mathematics. Discover the powerful utility calculations built to keep everyone happy and balanced.
            </p>
          </section>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-805 p-8 rounded-3xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Active Real-Time Sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Add an expense during dinner, and your entire group sees it update instantly. Built on a zero-lag reactive Cloud database that works reliably on standard cellular speeds worldwide.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-805 p-8 rounded-3xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Matrix SPLIT Solver</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our optimized debt-routing logic processes total ledger expenses to minimize the total transactions required to settle up. Instead of writing dozens of separate checks, settle with a single transaction.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-805 p-8 rounded-3xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Global Currencies</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Traveling across borders? Track your expenditures in any local currency. Traveler performs clean calculations so group divisions are converted smoothly, keeping your global trip accounts straightforward.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Publisher Content: Written Editorial Guide / Articles */}
      <div className="relative z-10 w-full bg-slate-900 text-slate-200 py-20 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-16">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Traveler Insights Manual</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Why Group Budget Planning Fails — and How to Fix It
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Shared travel experiences generate lifetime memories, but they also introduce one of the major friction points of adulthood: split expenses. When a group of friends travels, the financial dynamics are intricate. Different members have different spending limits, payment preferences, and assumptions about shared bills like lodging, group rides, and dining.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm leading-relaxed text-slate-300">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400 shrink-0" />
                1. Avoid the "Calculate Later" Trap
              </h3>
              <p>
                Many travel groups carry a mental note or pile of paper receipts in a wallet, promising to "sit down and figure it out" on the flight home. In practice, receipts get lost, credit card charges appear days late, and memory fading creates doubts about who ordered what dinner item. Entering costs immediately prevents disputes.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400 shrink-0" />
                2. Be Transparent About Base Budgets
              </h3>
              <p>
                A successful group trip starts with a direct, honest discussion of budgets. Whether booking accommodations or arranging rental vehicles, ensure every group member gets their choices valued. Setting up an agreed group pool or tracking it in a unified place preserves positive experiences and prevents surprise expenses.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400 shrink-0" />
                3. Streamline Your Debt Settlements
              </h3>
              <p>
                Splitting bills manually produces a complex web of transactions. If Alex owes Sam $20 and Sam owes Jess $20, the standard path is two payments. Advanced ledger calculation aggregates these connections, allowing Alex to directly pay Jess $20. Reducing the transaction volume keeps settlements clean and immediate.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-400 shrink-0" />
                4. Incorporate Digital Receipt Backups
              </h3>
              <p>
                Keeping physical receipts is inconvenient. Having digital copies or taking snapshot uploads ensures that everyone in the trip has an audit trail. It builds group trust and guarantees that if tax compliance or hotel billing adjustments occur, the documentation is immediately accessible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Publisher Content: FAQ Section */}
      <div className="relative z-10 w-full bg-slate-950 text-slate-200 py-20 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="text-center space-y-3">
            <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Everything you need to know about our smart travel manager.</p>
          </section>

          <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-base">Is Traveler free to use?</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Yes! Traveler is completely free. We do not place user features behind paid gateways. You can manage unlimited trips, invite as many group members as you desire, and perform unlimited real-time balance settlements.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-base">How does Google verification protect my account?</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                All logins are managed directly through Google Firebase OAuth. We do not read or record your password. We only request basic public profile metadata (username, email, and display picture) to display clearly in your group ledger lists.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-base">Can I run settlements in multiple currencies?</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Absolutely! When you create an expense item, you can tap the current currency indicator to type in any local currency code. Traveler maintains clear running divisions so calculations remain straightforward regardless of geographical locations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Crawlable Public Footer */}
      <footer className="relative z-10 w-full bg-slate-900 border-t border-slate-800/80 py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">Traveler</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/about" className="text-slate-400 hover:text-orange-400 font-bold transition-colors">About Us</Link>
            <Link to="/help" className="text-slate-400 hover:text-orange-400 font-bold transition-colors">Help Center</Link>
            <Link to="/contact" className="text-slate-400 hover:text-orange-400 font-bold transition-colors">Contact Support</Link>
            <Link to="/terms" className="text-slate-400 hover:text-orange-400 font-bold transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="text-slate-400 hover:text-orange-400 font-bold transition-colors">Privacy Policy</Link>
          </div>

          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Traveler Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
