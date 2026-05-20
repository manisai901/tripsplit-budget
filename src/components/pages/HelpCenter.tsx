import { motion } from 'motion/react';
import { HelpCircle, Plus, Receipt, Users, CreditCard, Search } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    icon: Plus,
    q: "How do I start a new trip?",
    a: "Click the 'New Trip' button on your dashboard. Give your trip a name, set a destination, and select your dates to get started."
  },
  {
    icon: Users,
    q: "How do I invite members?",
    a: "Open your trip details and click 'Add Member'. You can add trip mates by their email address. They will instantly see the trip on their dashboard."
  },
  {
    icon: Receipt,
    q: "Can I add photos of receipts?",
    a: "Yes! When adding an expense, click the image icon to upload a receipt. Others can view the receipt by clicking the icon next to the expense description."
  },
  {
    icon: CreditCard,
    q: "How are settlements calculated?",
    a: "Traveler automatically calculates the minimum number of transactions needed to settle all debts based on Everyone's spending and 'Paid By' records."
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-100 dark:bg-green-900/30 text-green-500 mb-2">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Help Center</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to know about using Traveler for your adventures.
          </p>

          <div className="max-w-md mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none dark:text-white"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFaqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-green-500 transition-colors mb-4">
                <faq.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{faq.q}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
