import { motion } from 'motion/react';
import { Info, Users, Compass, Globe, CheckCircle2, ShieldAlert, Heart, HardDrive, Smartphone } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 transition-colors">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* About Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 mb-2">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">About Traveler</h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Making group travel simple, mathematically transparent, and memorable.
          </p>
        </motion.div>

        {/* Highlight Stats / Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Collaborative Syncing', desc: 'Synchronise holiday expenses in real-time with automatic cloud balance calculations.' },
            { icon: Compass, title: 'Intelligent Budgeting', desc: 'Monitor where your money goes with visual categories for boarding, transport, and food.' },
            { icon: Globe, title: 'Global Coverage', desc: 'Track spending indices in any worldly currency with clean conversions and clear details.' }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <item.icon className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Description Essays */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-10 text-slate-600 dark:text-slate-300">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Our Mission</h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              We believe that exploration, community, and travel representing standard growth values. However, the logistical friction of recording shared bills, chasing individuals for payment, and computing tedious split mathematics often creates ambient tension in travel bubbles. 
              Traveler was conceptualized by a bunch of global wanderers who wanted a tool that does exactly one job beautifully: keep group finances completely transparent and fair, permitting travelers to refocus purely on making memories.
            </p>
          </section>

          <section className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Our Principles & Core Beliefs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Absolute Data Safety
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Your trips are intimate events. We enforce strict database isolation so that your ledgers and files are visible solely to those you explicitly invite.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-orange-500" />
                  Zero Platform Monetization Fees
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  We will never restrict standard trip creation or split capabilities behind a paywall. Traveler is built as a pure global utility.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-orange-500" />
                  Serverless Offline Operations
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  When scaling mountains or traveling through areas of limited connection, log expenditures instantly. The app caches entries and syncs once offline barriers resolve.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  Accessibility Across Platforms
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Traveler utilizes full cross-device fluid layouts. Review bills seamlessly on desktop workstations or mobile phones directly under the stars.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-8 text-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <ShieldAlert className="text-orange-500 w-5 h-5" />
              Corporate Accountability Disclaimer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Traveler is designed as a tracking budget helper. Financial calculations are executed in conformance with standard division formulas. For official financial audits, users are encouraged to maintain receipt copies and cross-examine balances directly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
