import { motion } from 'motion/react';
import { Scale, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 dark:text-slate-400">Please read these terms carefully before using Traveler.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Traveler, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              2. User Conduct
            </h2>
            <p>
              You are responsible for all content you post to Traveler. You agree not to use the service for any unlawful purposes or to conduct any activities that would violate the rights of others.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-500" />
              3. Limitation of Liability
            </h2>
            <p>
              Traveler is provided "as is" without any warranties. We are not liable for any financial inaccuracies that may result from calculations within the app. Users are encouraged to verify settlement amounts before making payments.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Traveler Inc. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
