import { motion } from 'motion/react';
import { Info, Users, Compass, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">About Traveler</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Making group travel simple, transparent, and memorable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Collaborative', desc: 'Sync expenses in real-time with your travel buddies.' },
            { icon: Compass, title: 'Organized', desc: 'Keep all your trip plans and receipts in one secure place.' },
            { icon: Globe, title: 'Global', desc: 'Track spending in any currency, anywhere in the world.' }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800"
            >
              <item.icon className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-left space-y-6"
        >
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            We believe that travel is the ultimate way to connect with the world and each other. However, the logistical stress of tracking shared expenses can often dampen the spirit of adventure. 
            Traveler was built to solve exactly that—giving you more time to explore and less time calculating who owes what.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
