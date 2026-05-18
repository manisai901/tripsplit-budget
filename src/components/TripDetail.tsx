import { 
  ArrowLeft, Plus, DollarSign, PieChart, Users, Receipt, 
  Trash2, TrendingUp, ChevronRight, MapPin, Plane, CheckCircle2, Circle, Clock, Share2, Copy, Check, UserMinus, X
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { formatDate, formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TripDetail() {
  const { user } = useAuth();
  const { activeTrip, expenses, checklist, members, addExpense, addChecklistItem, toggleChecklistItem, removeMember, setActiveTripId } = useTrip();
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isManagingAccess, setIsManagingAccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: 0, 
    category: 'Food', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [customCategory, setCustomCategory] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, exp) => sum + exp.amount, 0), 
  [expenses]);

  const progressPercent = Math.min(100, (totalSpent / (activeTrip?.budget || 1)) * 100);

  const isOwner = activeTrip?.ownerId === user?.uid;

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const finalCategory = newExpense.category === 'Other' ? (customCategory || 'Other') : newExpense.category;
    await addExpense(activeTrip.id, {
      ...newExpense,
      category: finalCategory,
      splitType: 'equal',
      participants: activeTrip.members
    });
    setIsAddingExpense(false);
    setNewExpense({ description: '', amount: 0, category: 'Food', date: new Date().toISOString().split('T')[0] });
    setCustomCategory('');
  };

  const handleAddCheckItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !newCheckItem.trim()) return;
    await addChecklistItem(activeTrip.id, newCheckItem.trim());
    setNewCheckItem('');
  };

  const copyTripId = () => {
    if (!activeTrip) return;
    navigator.clipboard.writeText(activeTrip.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTrip || !window.confirm('Are you sure you want to remove this nomad?')) return;
    await removeMember(activeTrip.id, memberId);
  };

  if (!activeTrip) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => setActiveTripId(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-bold uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Back to Console</span>
        </button>

        <button 
          onClick={copyTripId}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
          {copied ? 'Copied ID' : 'Invite Nomads'}
        </button>
      </div>

      {/* Header Stat Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <div className="stat-gradient p-6 md:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest opacity-80 animate-pulse">Live Budget Sync</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50 animate-ping" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-4 opacity-90 text-white truncate max-w-full">{activeTrip.name}</h1>
              <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                  {formatCurrency(totalSpent, activeTrip.currency)}
                </h2>
                <span className="text-base md:text-xl font-medium opacity-70">spent out of {formatCurrency(activeTrip.budget, activeTrip.currency)}</span>
              </div>
              <div className="mt-8 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 shrink-0">
                <div className="flex justify-between text-[10px] font-bold mb-3 uppercase tracking-widest">
                  <span>Usage Intensity</span>
                  <span>{Math.round(progressPercent)}% Exhausted</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.7)]"
                  />
                </div>
              </div>
            </div>
            <Plane className="absolute right-[-10%] bottom-[-10%] w-48 h-48 md:w-64 md:h-64 opacity-10 -rotate-12 pointer-events-none" />
          </div>
        </div>
        
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Manifest Analytics</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-between border border-blue-100/50 dark:border-blue-800/30">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Sector</span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-200">{activeTrip.destination}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl flex items-center justify-between border border-amber-100/50 dark:border-amber-800/30">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Expedition Size</span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{members.length} Nomads</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex items-center justify-between border border-purple-100/50 dark:border-purple-800/30">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Parity Share</span>
                <span className="text-sm font-bold text-purple-900 dark:text-purple-200">{formatCurrency(totalSpent / (members.length || 1), activeTrip.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Collaborative Checklist Section */}
        <div className="lg:col-span-12">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Trip Checklist
                </h4>
                <p className="text-xs text-slate-400 font-medium">Collaborative mission tasks with live attribution.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {checklist.filter(i => i.completed).length} / {checklist.length} Completed
                </span>
              </div>
            </div>

            <form onSubmit={handleAddCheckItem} className="flex gap-2 mb-8">
              <input 
                type="text" 
                placeholder="Add a mission objective..."
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white"
              />
              <button disabled={!newCheckItem} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                Add
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {checklist.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "group p-4 rounded-2xl border transition-all cursor-pointer",
                      item.completed 
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50"
                    )}
                    onClick={() => toggleChecklistItem(activeTrip.id, item.id, !item.completed)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 pointer-events-none">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pointer-events-none">
                        <p className={cn("text-xs font-bold leading-tight line-clamp-2 transition-all", item.completed && "line-through text-slate-400")}>
                          {item.text}
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                            <Clock className="w-2.5 h-2.5" />
                            {item.createdByName || 'Nomad'} @ {item.createdAt?.toDate ? formatDate(item.createdAt.toDate()) : 'Now'}
                          </div>
                          {item.completed && item.completedAt && (
                            <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Closed @ {formatDate(item.completedAt.toDate())}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Expenses Table Section */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Transaction Records</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Verified expenses for all members.</p>
              </div>
              <button 
                onClick={() => setIsAddingExpense(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                + Add Record
              </button>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto flex-1 min-h-[400px]">
              {expenses.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Receipt className="w-10 h-10 text-slate-100 dark:text-slate-800 mb-4" />
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">Awaiting ledger entries...</p>
                </div>
              ) : (
                expenses.map((expense, idx) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center font-bold text-xl border border-orange-100/50 dark:border-orange-900/20 group-hover:scale-110 transition-transform">
                        {expense.category === 'Food' ? '🍕' : expense.category === 'Transport' ? '🛥️' : expense.category === 'Stay' ? '🏨' : expense.category === 'Fun' ? '🎡' : '💸'}
                      </div>
                      <div>
                        <h5 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">{expense.description}</h5>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            By {expense.payerName || 'Member'} &bull; {formatDate(expense.date)}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                            {expense.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(expense.amount, activeTrip.currency)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Detailed Members List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Nomads</h3>
              <span className="text-[10px] font-bold text-orange-500 uppercase">{members.length} Online</span>
            </div>
            <div className="space-y-5">
              {members.map((member) => (
                <div key={member.uid} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                        referrerPolicy="no-referrer"
                        alt=""
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{member.displayName}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        member.role === 'owner' ? "text-orange-500" : "text-slate-400"
                      )}>
                        {member.role === 'owner' ? 'Trip Leader' : 'Explorer'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase">Joined</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{member.joinedAt?.toDate ? formatDate(member.joinedAt.toDate()) : 'Now'}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsManagingAccess(true)}
              className="w-full mt-8 py-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-orange-200 hover:text-orange-500 transition-all"
            >
              Manage Access
            </button>
          </div>
          
          <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50 mb-6">Settlement Parity</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Unsettled Pot</p>
                <p className="text-3xl font-black font-mono">{formatCurrency(totalSpent, activeTrip.currency)}</p>
              </div>
              <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                Start Equalizing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsAddingExpense(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
            >
              <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-3">
                <Receipt className="w-6 h-6 text-orange-500" />
                Track Expense
              </h2>
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Sushi Feast @ Tsukiji"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all dark:text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Amount ({activeTrip.currency})</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={newExpense.amount || ''}
                        onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                        className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
                    >
                      <option>Food</option>
                      <option>Transport</option>
                      <option>Stay</option>
                      <option>Fun</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <AnimatePresence>
                  {newExpense.category === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Custom Designation</label>
                      <input 
                        required={newExpense.category === 'Other'}
                        type="text" 
                        placeholder="e.g. Souvenirs"
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddingExpense(false)}
                    className="flex-1 h-12 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-12 rounded-xl font-bold bg-slate-900 dark:bg-orange-600 text-white shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Access Modal */}
      <AnimatePresence>
        {isManagingAccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsManagingAccess(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <div>
                  <h2 className="text-lg font-black dark:text-white">Expedition Control</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage nomad access and invitations</p>
                </div>
                <button onClick={() => setIsManagingAccess(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-8 p-5 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/10">
                  <h4 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-4">Transmission Channel (Trip ID)</h4>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 flex items-center overflow-hidden">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">{activeTrip.id}</span>
                    </div>
                    <button 
                      onClick={copyTripId}
                      className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors group"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />}
                    </button>
                  </div>
                  <p className="mt-3 text-[10px] text-orange-600/70 font-medium leading-relaxed">Share this ID with other nomads to have them join this trip's ledger system.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Onboard Nomads</h4>
                  {members.map(member => (
                    <div key={member.uid} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                          className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800"
                          referrerPolicy="no-referrer"
                          alt=""
                        />
                        <div>
                          <p className="text-sm font-bold dark:text-white">{member.displayName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                          member.role === 'owner' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {member.role === 'owner' ? 'Leader' : 'Nomad'}
                        </span>
                        {isOwner && member.uid !== user?.uid && (
                          <button 
                            onClick={() => handleRemoveMember(member.uid)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
