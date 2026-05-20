import { Compass, Mail, Github, Twitter, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-12 px-4 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:rotate-12 transition-transform duration-300">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Traveler</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
              Your ultimate companion for seamless group travel and expense tracking. 
              Built for adventurers, by adventurers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link to="/help" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors">Help Center</Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all hover:-translate-y-1">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all hover:-translate-y-1">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:manikantasaivootla@gmail.com" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all hover:-translate-y-1">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © {currentYear} Traveler Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
