import { motion } from 'motion/react';
import { HelpCircle, Plus, Receipt, Users, CreditCard, Search, BookOpen, Settings, Info, Map, LifeBuoy } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    icon: Plus,
    q: "How do I start a new trip?",
    a: "Click the 'New Trip' button on your dashboard. Give your trip a name, set a destination, and select your dates to get started. You can choose a custom background image or let our system pair a beautiful icon representing your journey automatically."
  },
  {
    icon: Users,
    q: "How do I invite members to my travel group?",
    a: "Open your trip details and click 'Add Member'. You can add trip mates by typing in their Google account email address. They will instantly see the collaborative ledger on their own dashboard without needing to re-enter any invitation tokens."
  },
  {
    icon: Receipt,
    q: "Can I add photos of receipts and invoices?",
    a: "Yes! When adding an expense, click the attachment or camera icon to upload a snapshot of your physical receipt. All travel buddies can view the digital copy instantly by clicking the receipt symbol next to the corresponding billing list item."
  },
  {
    icon: CreditCard,
    q: "How are the final debt settlements calculated?",
    a: "Traveler utilizes a custom ledger simplification algorithm that maps the matrix of mutual debts. It automatically shifts and matches positive and negative balances so everyone settles their bills in the absolute fewest overall transaction steps."
  },
  {
    icon: Settings,
    q: "Can I edit an expense once it is posted?",
    a: "Absolutely. Trip moderators and the member who originally entered the expense can tap on any item listed in the ledger history to adjust the description, split values, currency reference, or upload a replacement receipt image."
  },
  {
    icon: Info,
    q: "How are currency conversions processed?",
    a: "When you tag a transaction in a foreign currency, Traveler registers it directly with the original amount. All settlements are converted using standard reference multipliers so that everyone's core travel balances remain transparent and mathematically correct."
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 transition-colors">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Help Center Header Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 mb-2">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Help & Knowledge Center</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Everything you need to know about setting up trips, inviting friends, managing receipts, and mastering shared budgets.
          </p>

          <div className="max-w-md mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search help guide & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none dark:text-white text-sm"
            />
          </div>
        </motion.div>

        {/* Dynamic FAQs Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <LifeBuoy className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors mb-4">
                  <faq.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 leading-snug">{faq.q}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No matching help articles found. Try another query.</p>
            </div>
          )}
        </div>

        {/* Detailed Written Guides for AdSense High-Value Content Validation */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-12">
          
          {/* Guide Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Comprehensive Travel Budgeting Guide</h2>
          </div>

          {/* Guide 1 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-lg text-sm font-bold">1</span>
              Initializing Your Shared Trip Ledger
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-9">
              To guarantee seamless expense management on a holiday, a unified collaborative digital ledger must be established before boarding flights. In Traveler, we authorize this structure as a "Trip Ledger instance." Setting up a trip instigates an active shared ledger. This is where basic properties are declared: naming convention (e.g. "Rome Summer Voyage 2026"), primary base currency (USD, EUR, GBP, AUD, etc.), and the overarching target budget to provide warnings if group expenditures cross sustainable paths.
            </p>
          </div>

          {/* Guide 2 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-lg text-sm font-bold">2</span>
              Inviting Group Members & Synchronizing Access Controls
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-9">
              Cohesiveness relies on inviting every member of your travel bunch directly into the trip. By inputting their email identifier, Traveler ties their account to the shared Firestore cloud. The synchronization is seamless—once invited, the trip displays instantly on your buddy's home page when they sign in. It eliminates the friction of copying and sharing long alphanumeric entry codes or sending spreadsheet attachments over text messages. All members can then view, modify, delete, or confirm entries in real-time.
            </p>
          </div>

          {/* Guide 3 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-lg text-sm font-bold">3</span>
              How Traveler's Settle Debts Optimization Logic Operates
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-9">
              The primary benefit of digital splitting platforms is the simplification of end-of-trip settlement checks. Normally, if five friends spend independently on transport, accommodations, food, and sightseeing, settling up would trigger a dizzying carousel of banking transfers.
              Our platform uses an engineering optimization solver that maps positive balances (creditors) against negative balances (debtors). By consolidating overall balances down to a single total net figure per individual, we calculate the absolute shortest path of transfers to return everyone to zero. Instead of sending five separate wire payments, the group solves the entire financial slate using the minimum possible payments.
            </p>
          </div>

          {/* Guide 4 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-500 text-white rounded-lg text-sm font-bold">3</span>
              Tips for Mitigating Disputes on Shared Journeys
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pl-9">
              Managing expenses effectively goes beyond math; it touches on communication and transparency. Best practices suggest that larger expenses (like rental accommodations and international airfare) should be logged on the ledger immediately. Meanwhile, smaller daily costs like street food, subway tickets, and coffees can be tracked dynamically as they happen without bogging down the travel rhythm. Uploading a quick snapshot of grocery bills or parking receipts means that any doubts or calculation queries are easily verified, preserving positive relationships on the trip.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
