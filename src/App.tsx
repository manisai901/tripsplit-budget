/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTrip } from './context/TripContext';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import TripDetail from './components/TripDetail';
import RouteProgressBar from './components/RouteProgressBar';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { activeTrip, loading: tripsLoading } = useTrip();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen relative">
      <RouteProgressBar />
      <Header />
      
      <main className="animate-fade-in relative z-10">
        <AnimatePresence mode="wait">
          {activeTrip ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TripDetail />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
    <AuthProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </AuthProvider>
  );
}

