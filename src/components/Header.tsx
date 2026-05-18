import { Plane, LogOut, User as UserIcon, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as any) || 'light'
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const switchAccount = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between px-4 md:px-8 transition-colors">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Plane className="text-white w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">NomadPay</span>
          <span className="text-sm md:text-lg font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[120px] md:max-w-none">
            {user ? 'My Journeys' : 'Trip Explorer'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {user && (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium dark:text-white leading-none">{user.displayName}</p>
              <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="focus:outline-none"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 p-0.5 hover:border-orange-500 transition-colors cursor-pointer"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 border-transparent hover:border-slate-200 transition-colors cursor-pointer">
                    <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                  </div>
                )}
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                    <div className="px-4 py-2 sm:hidden border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-sm font-bold dark:text-white truncate">{user.displayName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={switchAccount}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-left"
                    >
                      <Monitor className="w-4 h-4" />
                      Switch Account
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
