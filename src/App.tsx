/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTrip } from './context/TripContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import TripDetail from './components/TripDetail';
import RouteProgressBar from './components/RouteProgressBar';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import TermsOfService from './components/pages/TermsOfService';
import HelpCenter from './components/pages/HelpCenter';
import { AnimatePresence, motion } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useEffect, useState } from 'react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { activeTrip } = useTrip();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as any) || 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll to top on route change or trip switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, activeTrip?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster theme={theme} position="top-center" />
        <AuthScreen theme={theme} setTheme={setTheme} />
      </>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <Toaster theme={theme} position="top-center" />
      <RouteProgressBar />
      <Header theme={theme} setTheme={setTheme} />
      
      <main className="animate-fade-in relative z-10 flex-grow pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trip/:tripId" element={<TripDetail />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <MobileNav />

      {/* Global Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#F9FAFB] dark:bg-slate-950 transition-colors">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 dark:bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-500/5 dark:bg-slate-400/5 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TripProvider>
          <AppContent />
        </TripProvider>
      </AuthProvider>
    </Router>
  );
}

