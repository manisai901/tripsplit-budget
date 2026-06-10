import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400">Last updated: May 20, 2024</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              Privacy Commitment
            </h2>
            <p>
              We believe in absolute privacy. We do not see, collect, or track any kind of personal data from our users. Your trips, expenses, and personal details are strictly private to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Your Data, Your Control
            </h2>
            <p>
              All data you enter into Traveler—including trip locations, budgets, and member lists—is stored securely in your own encrypted database instance. We have no access to your trip details, and we do not monitor your activity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              No Data Collection
            </h2>
            <p>
              We do not use tracking cookies, we do not sell data to third parties, and we do not collect analytics on how you use your private trips. Traveler is a pure utility tool for your convenience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Data Security
            </h2>
            <p>
              By leveraging industry-standard security protocols, your data is protected from unauthorized access. Your trip details are only visible to you and the teammates you explicitly invite via their email address.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-400">
            <p>Contact us at manikantasaivootla@gmail.com for any questions regarding this policy.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
