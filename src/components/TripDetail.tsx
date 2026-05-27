import { 
  ArrowLeft, Plus, DollarSign, PieChart as PieChartIcon, Users, Receipt, 
  Trash2, TrendingUp, ChevronRight, MapPin, Plane, CheckCircle2, Circle, Clock, Share2, Copy, Check, UserMinus, X, Filter, Calendar as CalendarIcon, Tag, User as UserIcon, Image as ImageIcon, Activity, AlertTriangle, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTrip } from '../context/TripContext';
import { formatDate, formatCurrency, cn, formatDateTime, formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserAvatar } from './Avatar';

export default function TripDetail() {
  const { user } = useAuth();
  const { trips, activeTrip, expenses, checklist, members, addExpense, addChecklistItem, toggleChecklistItem, removeMember, approveMember, updateChecklistItem, setActiveTripId, joinTrip, loading } = useTrip();
  const { tripId } = useParams();
  const navigate = useNavigate();

  const approvedMembers = useMemo(() => members.filter(m => m.role !== 'pending'), [members]);
  const pendingMembers = useMemo(() => members.filter(m => m.role === 'pending'), [members]);
  const currentUserMember = useMemo(() => members.find(m => m.uid === user?.uid), [members, user]);
  const isPending = currentUserMember?.role === 'pending';

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueTime, setEditingDueTime] = useState('');

  useEffect(() => {
    if (tripId && (!activeTrip || activeTrip.id !== tripId)) {
      setActiveTripId(tripId);
    }
  }, [tripId, activeTrip?.id, setActiveTripId]);

  const [directTrip, setDirectTrip] = useState<any>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState(false);
  const [isJoiningDirect, setIsJoiningDirect] = useState(false);

  useEffect(() => {
    let active = true;
    const isAlreadyLoaded = trips.some(t => t.id === tripId);
    
    if (!loading && !activeTrip && tripId && user && !isAlreadyLoaded) {
      setDirectLoading(true);
      setDirectError(false);
      const tripRef = doc(db, 'trips', tripId);
      getDocFromServer(tripRef).then((snap) => {
        if (!active) return;
        if (snap.exists()) {
          setDirectTrip({ id: snap.id, ...snap.data() });
        } else {
          setDirectError(true);
        }
        setDirectLoading(false);
      }).catch((err) => {
        if (!active) return;
        console.error("Error fetching trip directly:", err);
        setDirectError(true);
        setDirectLoading(false);
      });
    } else {
      setDirectTrip(null);
    }
    return () => {
      active = false;
    };
  }, [loading, activeTrip, tripId, user, trips]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isManagingAccess, setIsManagingAccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [splitOption, setSplitOption] = useState<'all' | 'custom'>('all');
  const [customParticipants, setCustomParticipants] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: 0, 
    category: 'Food', 
    date: new Date().toISOString().split('T')[0],
    time: '',
    payerId: user?.uid || ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newCheckTime, setNewCheckTime] = useState('');

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPayer, setFilterPayer] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filterCategory !== 'All' && exp.category !== filterCategory) return false;
      if (filterPayer !== 'All' && exp.payerId !== filterPayer) return false;
      if (filterStartDate && exp.date < filterStartDate) return false;
      if (filterEndDate && exp.date > filterEndDate) return false;
      return true;
    });
  }, [expenses, filterCategory, filterPayer, filterStartDate, filterEndDate]);

  const totalSpent = useMemo(() => 
    expenses
      .filter(exp => exp.category !== 'Settlement')
      .reduce((sum, exp) => sum + exp.amount, 0), 
  [expenses]);

  const categoryChartData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.filter(exp => exp.category !== 'Settlement').forEach(exp => {
      data[exp.category] = (data[exp.category] || 0) + exp.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const memberChartData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.filter(exp => exp.category !== 'Settlement').forEach(exp => {
      data[exp.payerName] = (data[exp.payerName] || 0) + exp.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);
  
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#eab308', '#ec4899'];

  const settlementData = useMemo(() => {
    const data: Record<string, { paid: number; share: number; realPaid: number; realShare: number }> = {};
    
    // Initialize
    approvedMembers.forEach(m => {
      data[m.uid] = { paid: 0, share: 0, realPaid: 0, realShare: 0 };
    });

    // Calculate
    expenses.forEach(exp => {
      const isSettlement = exp.category === 'Settlement';
      
      // Add to payer's paid total
      if (data[exp.payerId]) {
        data[exp.payerId].paid += exp.amount;
        if (!isSettlement) data[exp.payerId].realPaid += exp.amount;
      }

      // Add to each participant's share
      const participants = exp.participants || activeTrip?.members || [];
      const sharePerPerson = exp.amount / (participants.length || 1);
      participants.forEach((p: any) => {
        const uid = typeof p === 'string' ? p : (p.uid || p.id);
        if (data[uid]) {
          data[uid].share += sharePerPerson;
          if (!isSettlement) data[uid].realShare += sharePerPerson;
        }
      });
    });

    return approvedMembers.map(m => ({
      ...m,
      paid: data[m.uid]?.paid || 0,
      share: data[m.uid]?.share || 0,
      realPaid: data[m.uid]?.realPaid || 0,
      realShare: data[m.uid]?.realShare || 0,
      balance: (data[m.uid]?.paid || 0) - (data[m.uid]?.share || 0)
    }));
  }, [approvedMembers, expenses]);

  const explicitDebts = useMemo(() => {
    const sortedData = [...settlementData];
    const creditors = sortedData.filter(m => m.balance > 0.01).map(m => ({ ...m, currentBalance: m.balance }));
    const debtors = sortedData.filter(m => m.balance < -0.01).map(m => ({ ...m, currentBalance: Math.abs(m.balance) }));
    
    const transactions = [];
    
    let i = 0;
    let j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.currentBalance, debtor.currentBalance);
      
      transactions.push({
        id: `${debtor.uid}-${creditor.uid}-${amount}`,
        from: debtor.displayName,
        fromId: debtor.uid,
        to: creditor.displayName,
        toId: creditor.uid,
        amount: amount
      });
      
      creditor.currentBalance -= amount;
      debtor.currentBalance -= amount;
      
      if (creditor.currentBalance < 0.01) i++;
      if (debtor.currentBalance < 0.01) j++;
    }
    
    return transactions;
  }, [settlementData]);

  const progressPercent = Math.min(100, (totalSpent / (activeTrip?.budget || 1)) * 100);

  const isOwner = activeTrip?.ownerId === user?.uid;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        alert("File size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const finalCategory = newExpense.category === 'Other' ? (customCategory || 'Other') : newExpense.category;
    const now = new Date();
    const defaultTime = formatTime(now); // Requires 'formatTime' import if not already
    const selectedPayerId = newExpense.payerId || user?.uid;
    const selectedPayerName = members.find(m => m.uid === selectedPayerId)?.displayName || user?.displayName || 'Unknown';
    
    // Ensure at least one participant is selected if custom
    let participants = splitOption === 'all' ? activeTrip.members : customParticipants;
    if (participants.length === 0) {
      participants = activeTrip.members; // fallback
    }
    
    await addExpense(activeTrip.id, {
      ...newExpense,
      time: newExpense.time || defaultTime,
      category: finalCategory,
      splitType: 'equal',
      participants,
      payerId: selectedPayerId,
      payerName: selectedPayerName,
      createdByName: user?.displayName || 'Unknown',
      ...(receiptImage ? { receiptUrl: receiptImage } : {})
    });
    setIsAddingExpense(false);
    setSplitOption('all');
    setCustomParticipants([]);
    setReceiptImage(null);
    setNewExpense({ description: '', amount: 0, category: 'Food', date: new Date().toISOString().split('T')[0], time: '', payerId: user?.uid || '' });
    setCustomCategory('');
  };

  const handleAddCheckItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !newCheckItem.trim()) return;
    await addChecklistItem(activeTrip.id, newCheckItem.trim(), newCheckTime);
    setNewCheckItem('');
    setNewCheckTime('');
  };

  const downloadCsv = () => {
    if (!activeTrip || expenses.length === 0) return;
    const headers = ['Date', 'Time', 'Category', 'Description', 'Amount', 'Currency', 'Payer', 'Participants'];
    const rows = expenses.map(e => [
      e.date,
      e.time || '',
      e.category,
      e.description,
      e.amount,
      activeTrip.currency,
      e.payerName,
      e.participants.join('|')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journey_${activeTrip.id}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTripId = () => {
    if (!activeTrip) return;
    navigator.clipboard.writeText(activeTrip.id);
    setCopied(true);
    toast.success('Invite ID Copied! Send it to your friends.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTrip || !window.confirm('Are you sure you want to remove this member?')) return;
    await removeMember(activeTrip.id, memberId);
  };

  const isTransitioning = useMemo(() => {
    return trips.some(t => t.id === tripId) && !activeTrip;
  }, [trips, tripId, activeTrip]);

  if (loading || directLoading || isTransitioning) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 min-h-screen">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
          <div className="w-3/4 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="flex gap-4">
             <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
             <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
             {[1,2,3,4].map(i => <div key={i} className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
          <div className="flex gap-4 mt-8">
             <div className="w-full h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activeTrip && directTrip) {
    const handleJoinDirect = async () => {
      try {
        setIsJoiningDirect(true);
        await joinTrip(directTrip.id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsJoiningDirect(false);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="w-16 h-16 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto text-orange-500">
            <Plane className="w-8 h-8" />
          </div>
          
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block animate-pulse">Adventure Shared Invitation</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
            Join "{directTrip.name}"
          </h2>
          
          {directTrip.destination && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-6">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>{directTrip.destination}</span>
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            You've been invited to co-manage expenses, update checklists, and track spending budgets alongside colleagues and friends inside this trip.
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleJoinDirect}
              disabled={isJoiningDirect}
              className="w-full h-12 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isJoiningDirect ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Joining Expedition...</span>
                </>
              ) : (
                <span>Accept Invite & Jump In</span>
              )}
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="w-full h-12 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
            >
              Go to My Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors px-4 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-400">
          <Plane className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Trip Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-xs">We couldn't find the journey you're looking for. It may have been deleted or you don't have access.</p>
        <button 
          onClick={() => navigate('/')}
          className="h-12 px-8 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 min-h-screen">
      <div className="sticky top-[56px] md:top-[64px] z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-bold uppercase tracking-[0.2em] text-[10px] md:text-[10px]">Back</span>
        </button>

        <div className="flex items-center gap-2">
           <button 
             onClick={copyTripId}
             className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-orange-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 hover:scale-[1.02]"
           >
             {copied ? <Check className="w-3 h-3 text-green-300" /> : <Share2 className="w-3 h-3" />}
             {copied ? 'Copied ID' : 'Invite'}
           </button>
           <a 
             href={`https://wa.me/?text=${encodeURIComponent(`Hey! Join my trip *${activeTrip.name}* on *TripSplit Budget* to split our expenses and sync budgets in real time! ✈️💰\n\nTrip ID: *${activeTrip.id}*\n\nJoin here: https://tripsplit-budget.vercel.app`)}`}
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 hover:scale-[1.02]"
           >
             <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
               <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.117.956 11.53.956 6.095.956 1.671 5.328 1.667 10.757c-.001 1.705.452 3.369 1.31 4.837l-.859 3.136 3.226-.834zm13.111-6.196c-.332-.166-1.966-.97-2.271-1.082-.306-.112-.529-.166-.75.166-.222.332-.857 1.082-1.051 1.302-.195.221-.39.248-.722.082-.332-.166-1.401-.516-2.668-1.646-.985-.88-1.65-1.968-1.843-2.3-.193-.332-.021-.511.144-.676.15-.148.332-.387.498-.581.166-.193.221-.332.332-.553.111-.221.055-.415-.027-.581-.082-.166-.75-1.804-1.026-2.47-.27-.648-.544-.56-.75-.571-.193-.01-.415-.011-.637-.011-.222 0-.582.082-.886.415-.304.331-1.162 1.135-1.162 2.766 0 1.631 1.189 3.208 1.355 3.429.166.221 2.341 3.58 5.672 5.016.792.341 1.41.545 1.892.699.796.253 1.52.217 2.093.131.638-.095 1.966-.803 2.242-1.58.277-.777.277-1.442.194-1.58-.083-.139-.304-.221-.636-.387z"/>
             </svg>
             <span>WhatsApp</span>
           </a>
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-4 mb-8">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 animate-pulse mt-0.5" />
          <div className="space-y-1 block">
            <h4 className="text-xs font-bold uppercase tracking-wider">Join Request Pending</h4>
            <p className="text-[11px] leading-relaxed opacity-90 font-medium">
              You are waiting for the Trip Leader to confirm your participation. You can view trip details as read-only. Standard features will unlock once approved.
            </p>
          </div>
        </div>
      )}

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
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter break-all">
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
                    className={cn(
                      "h-full shadow-[0_0_15px_rgba(255,255,255,0.7)]",
                      progressPercent >= 90 ? "bg-red-500" : progressPercent >= 80 ? "bg-yellow-400" : "bg-white"
                    )}
                  />
                </div>
                <AnimatePresence>
                  {progressPercent >= 80 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 backdrop-blur-md"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-200" />
                      <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest">
                        {progressPercent >= 100 ? "Budget exceeded" : "Approaching budget limit"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{approvedMembers.length} Members</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex items-center justify-between border border-purple-100/50 dark:border-purple-800/30">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Parity Share</span>
                <span className="text-sm font-bold text-purple-900 dark:text-purple-200">{formatCurrency(totalSpent / (approvedMembers.length || 1), activeTrip.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid lg:grid-cols-12 gap-8 mb-8">
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Category Spending</h4>
                <div className="h-48 w-full -ml-[10px]">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value, activeTrip.currency)}
                          contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
                  )}
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Member Contributions</h4>
                <div className="h-48 w-full -ml-4">
                   {memberChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={memberChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tickMargin={10} stroke="#94a3b8" />
                        <YAxis hide />
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value, activeTrip.currency)}
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]}>
                           {memberChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 mb-8">
        {/* Collaborative Checklist Section */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-8 h-full">
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

            <form onSubmit={handleAddCheckItem} className="flex flex-col md:flex-row gap-3.5 mb-8">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder={isPending ? "Pending Leader confirmation..." : "Add a mission objective..."}
                  value={newCheckItem}
                  disabled={isPending}
                  onChange={e => setNewCheckItem(e.target.value)}
                  className="flex-1 h-14 md:h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 text-base md:text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white disabled:opacity-60"
                />
                <input 
                  type="time" 
                  value={newCheckTime}
                  disabled={isPending}
                  onChange={e => setNewCheckTime(e.target.value)}
                  className="w-full sm:w-36 h-14 md:h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base md:text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white disabled:opacity-60"
                />
              </div>
              <button disabled={!newCheckItem || isPending} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 h-14 md:h-12 rounded-xl text-sm md:text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                Add Objective
              </button>
            </form>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-bold tracking-wide -mt-6 mb-8 block select-none">
              *(You only have one chance to modify this objective later)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
              <AnimatePresence>
                {checklist.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "group p-4 rounded-2xl border transition-all",
                        isEditing ? "bg-slate-50 dark:bg-slate-800 border-orange-500/50" : (
                          item.completed 
                            ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60" 
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 cursor-pointer"
                        )
                      )}
                      onClick={() => {
                        if (isEditing) return;
                        if (isPending) {
                          toast.error('You are pending leader confirmation');
                          return;
                        }
                        toggleChecklistItem(activeTrip.id, item.id, !item.completed);
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-3 w-full" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white"
                            placeholder="Modify objective..."
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="time" 
                              value={editingDueTime}
                              onChange={e => setEditingDueTime(e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 h-9 text-xs outline-none dark:text-white flex-1"
                            />
                            <button 
                              onClick={async () => {
                                if (!editingText.trim()) return;
                                await updateChecklistItem(activeTrip.id, item.id, editingText.trim(), editingDueTime);
                                setEditingItemId(null);
                              }}
                              className="h-9 px-3 bg-slate-900 dark:bg-orange-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingItemId(null)}
                              className="h-9 px-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] uppercase tracking-wider font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 justify-between h-full w-full">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-bold leading-tight break-words transition-all", item.completed && "line-through text-slate-400")}>
                                {item.text}
                                {item.dueTime && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-mono no-underline inline-block">
                                    {item.dueTime}
                                  </span>
                                )}
                              </p>
                              <div className="mt-2 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-400">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.createdByName || 'Member'} @ {item.createdAt?.toDate ? formatDateTime(item.createdAt.toDate()) : 'Now'}
                                </div>
                                {item.completed && item.completedAt && (
                                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Closed @ {formatDateTime(item.completedAt.toDate())}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Option to modify: 1 time only if not completed and not pending and hasn't been modified yet */}
                          {!item.completed && !isPending && (
                            <div className="flex shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                              {(!item.modifiedCount || item.modifiedCount < 1) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditingText(item.text);
                                    setEditingDueTime(item.dueTime || '');
                                  }}
                                  className="p-1 px-2 text-[8px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold uppercase rounded border border-amber-500/20 transition-all align-middle"
                                  title="Modify (1 chance only)"
                                >
                                  Modify
                                </button>
                              ) : (
                                <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800/85 px-1 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50 select-none align-middle">
                                  Modified
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Live Activity Feed Component inline mapping */}
        <div className="lg:col-span-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-8 h-full flex flex-col">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Activity</h4>
              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                 {expenses.slice(0, 5).map(exp => (
                    <div key={exp.id} className="flex gap-3">
                       <UserAvatar 
                         uid={exp.payerId} 
                         displayName={exp.payerName}
                         photoURL={members.find(m => m.uid === exp.payerId)?.photoURL} 
                         className="w-8 h-8 font-bold text-[10px]"
                       />
                       <div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                             <strong>{exp.payerName}</strong> added <strong className="text-orange-500">{formatCurrency(exp.amount, activeTrip.currency)}</strong> for {exp.category.toLowerCase()}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDate(exp.date)} {exp.time ? exp.time : ''}</p>
                       </div>
                    </div>
                 ))}
                 {expenses.length === 0 && <p className="text-xs text-slate-400 text-center py-10">No activity yet.</p>}
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Expenses Table Section */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Transaction Records</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Verified expenses for all members.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      isFiltersOpen || filterCategory !== 'All' || filterPayer !== 'All' || filterStartDate || filterEndDate
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Filter className="w-3 h-3" />
                    Filters
                    {(filterCategory !== 'All' || filterPayer !== 'All' || filterStartDate || filterEndDate) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5"></span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsAddingExpense(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    + Add Record
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isFiltersOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 pb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                      {/* Payer Filter */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          <UserIcon className="w-3 h-3" /> Payer
                        </label>
                        <select
                          value={filterPayer}
                          onChange={(e) => setFilterPayer(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none dark:text-white text-xs font-medium"
                        >
                          <option value="All">All Members</option>
                          {members.map(m => (
                            <option key={m.uid} value={m.uid}>{m.displayName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          <Tag className="w-3 h-3" /> Category
                        </label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none dark:text-white text-xs font-medium"
                        >
                          <option value="All">All Categories</option>
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Stay">Stay</option>
                          <option value="Fun">Fun</option>
                          <option value="Settlement">Settlement</option>
                          <option value="Other">Other...</option>
                        </select>
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          <CalendarIcon className="w-3 h-3" /> Start Date
                        </label>
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none dark:text-white text-xs font-medium"
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                          <CalendarIcon className="w-3 h-3" /> End Date
                        </label>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none dark:text-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto flex-1 min-h-[400px]">
              {filteredExpenses.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Receipt className="w-10 h-10 text-slate-100 dark:text-slate-800 mb-4" />
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    {expenses.length > 0 ? "No records match filters" : "Awaiting ledger entries..."}
                    {expenses.length > 0 && (
                      <button onClick={() => {
                        setFilterCategory('All');
                        setFilterPayer('All');
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }} className="text-orange-500 hover:underline cursor-pointer">Clear Filters</button>
                    )}
                  </p>
                </div>
              ) : (
                filteredExpenses.map((expense, idx) => (
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
                        <h5 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {expense.description}
                          {expense.receiptUrl && (
                            <button 
                              onClick={() => setPreviewReceipt(expense.receiptUrl!)}
                              className="text-slate-400 hover:text-orange-500 transition-colors"
                              title="View Receipt"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                        </h5>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md">
                            {members.find(m => m.uid === expense.payerId)?.photoURL ? (
                               <img src={members.find(m => m.uid === expense.payerId)?.photoURL} alt={expense.payerName} className="w-4 h-4 rounded-full" />
                            ) : (
                               <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0" />
                            )}
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                              <span className="text-slate-700 dark:text-slate-300">{expense.payerName || 'Member'}</span>
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            &bull; {formatDate(expense.date)}
                            {expense.createdByName && expense.createdByName !== expense.payerName && (
                              <span className="ml-2 opacity-60 italic normal-case font-medium">Logged by {expense.createdByName}</span>
                            )}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                            {expense.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(expense.amount, activeTrip.currency)}
                      </span>
                      {expense.time && (
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 leading-none shadow-sm">
                          {expense.time}
                        </span>
                      )}
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
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Members</h3>
              <span className="text-[10px] font-bold text-orange-500 uppercase">{approvedMembers.length} Approved</span>
            </div>

            {isOwner && pendingMembers.length > 0 && (
              <button 
                onClick={() => setIsManagingAccess(true)}
                className="w-full mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 hover:bg-amber-500/15 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 transition-all cursor-pointer animate-pulse"
              >
                <span className="flex items-center gap-1.5 align-middle select-none">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 inline-block" />
                  {pendingMembers.length} Request pending
                </span>
                <span className="text-orange-500 dark:text-amber-300">View Requests &rarr;</span>
              </button>
            )}

            <div className="space-y-5">
              {approvedMembers.map((member) => (
                <div key={member.uid} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar 
                        uid={member.uid}
                        displayName={member.displayName}
                        photoURL={member.photoURL}
                        className="w-10 h-10 font-bold border-2 border-white dark:border-slate-800 shadow-sm"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{member.displayName}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider",
                        member.role === 'owner' ? "text-orange-500" : "text-slate-400"
                      )}>
                        {member.role === 'owner' ? 'Trip Leader' : 'Traveler'}
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
          
          <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-6 flex items-center justify-between">
                Settlement Parity
                <TrendingUp className="w-3 h-3 text-orange-400" />
              </h4>
              
              <div className="space-y-4 mb-6">
                {settlementData.map(member => (
                  <div 
                    key={member.uid} 
                    className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setExpandedMember(expandedMember === member.uid ? null : member.uid)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar 
                          uid={member.uid}
                          displayName={member.displayName}
                          photoURL={member.photoURL}
                          className="w-5 h-5 text-[8px] border border-white/10"
                        />
                        <span className="text-[10px] font-bold truncate max-w-[80px]">{member.displayName}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black font-mono px-2 py-0.5 rounded",
                        member.balance >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {member.balance >= 0 ? '+' : ''}{formatCurrency(member.balance, activeTrip.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest opacity-40">
                      <span>Paid: {formatCurrency(member.realPaid, activeTrip.currency)}</span>
                      <span>Personal Use: {formatCurrency(member.realShare, activeTrip.currency)}</span>
                    </div>

                    <AnimatePresence>
                      {expandedMember === member.uid && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-2 border-t border-white/10 space-y-2.5">
                            <div className="flex justify-between text-[7px] font-bold uppercase tracking-widest opacity-30 mb-1">
                              <span>Expense</span>
                              <div className="flex gap-4">
                                <span className="w-12 text-right">Paid</span>
                                <span className="w-12 text-right">Used</span>
                              </div>
                            </div>
                            {expenses.filter(exp => exp.category !== 'Settlement' && (exp.payerId === member.uid || (exp.participants || activeTrip.members || []).some((p: any) => (typeof p === 'string' ? p : (p.uid || p.id)) === member.uid))).map(exp => {
                              const isPayer = exp.payerId === member.uid;
                              const pts = exp.participants || activeTrip.members || [];
                              const isParticipant = pts.some((p: any) => (typeof p === 'string' ? p : (p.uid || p.id)) === member.uid);
                              const myShare = isParticipant ? exp.amount / (pts.length || 1) : 0;
                              
                              return (
                                <div key={exp.id} className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-300 truncate max-w-[100px]">{exp.description}</span>
                                  <div className="flex gap-4 font-mono text-[9px]">
                                    <span className={cn("w-12 text-right", isPayer ? "text-emerald-400" : "text-slate-600")}>
                                      {isPayer ? `+${formatCurrency(exp.amount, activeTrip.currency)}` : '-'}
                                    </span>
                                    <span className={cn("w-12 text-right", isParticipant ? "text-red-400" : "text-slate-600")}>
                                      {isParticipant ? `-${formatCurrency(myShare, activeTrip.currency)}` : '-'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {explicitDebts.length > 0 && (
                <div className="mb-6 pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">Who Owes Whom</p>
                  <div className="space-y-2">
                    {explicitDebts.map(debt => (
                      <div key={debt.id} className="flex items-center justify-between text-[11px] font-medium bg-white/5 p-2.5 rounded-xl text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate max-w-[70px]">{debt.from}</span>
                          <span className="text-orange-400 text-[10px]">→</span>
                          <span className="font-bold text-white truncate max-w-[70px]">{debt.to}</span>
                        </div>
                        <span className="font-black font-mono">{formatCurrency(debt.amount, activeTrip.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-bold uppercase opacity-40 mb-1">Total Expedition Fund</p>
                <p className="text-2xl font-black font-mono">{formatCurrency(totalSpent, activeTrip.currency)}</p>
              </div>
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
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Amount ({activeTrip.currency})</label>
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
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
                  >
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Stay</option>
                    <option>Fun</option>
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Bus</option>
                    <option>Train</option>
                    <option>Auto</option>
                    <option>Other</option>
                  </select>
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

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Receipt Image (Optional, max 1MB)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {receiptImage && (
                      <div className="relative group">
                        <img src={receiptImage} alt="Receipt preview" className="h-12 w-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                        <button 
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {!receiptImage && <span className="text-[10px] text-slate-400">Attach receipt</span>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Paid By</label>
                  <select 
                    value={newExpense.payerId || user?.uid || ''}
                    onChange={e => setNewExpense({...newExpense, payerId: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm shrink-0"
                  >
                    {members.map(member => (
                      <option key={member.uid} value={member.uid}>
                        {member.displayName} {member.uid === user?.uid ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Split Preference</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOption('all');
                        setCustomParticipants([]);
                      }}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        splitOption === 'all' 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Equal to All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOption('custom');
                        setCustomParticipants(activeTrip.members); // initialize with all selected
                      }}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        splitOption === 'custom' 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Select Members
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {splitOption === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-2 pt-2"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Who is included?</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {members.map(member => (
                          <label key={member.uid} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                            <input
                              type="checkbox"
                              checked={customParticipants.includes(member.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomParticipants(prev => [...prev, member.uid]);
                                } else {
                                  // Don't allow deselecting if it's the last one
                                  if (customParticipants.length > 1) {
                                    setCustomParticipants(prev => prev.filter(id => id !== member.uid));
                                  }
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                            />
                            <div className="flex items-center gap-2">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt="" className="w-6 h-6 rounded-full" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                              )}
                              <span className="text-sm font-medium dark:text-white">{member.displayName}</span>
                            </div>
                          </label>
                        ))}
                      </div>
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
                  <h2 className="text-lg font-black dark:text-white">Trip Control</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage member access and invitations</p>
                </div>
                <button onClick={() => setIsManagingAccess(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-8 p-5 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/10">
                  <h4 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-4">Transmission Channel (Trip ID)</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 flex items-center overflow-hidden">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">{activeTrip.id}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setIsManagingAccess(false);
                          navigate('/');
                        }}
                        className="flex-1 sm:flex-none h-12 px-5 flex items-center justify-center bg-slate-900 dark:bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        Dashboard
                      </button>
                      <button 
                        onClick={copyTripId}
                        title="Copy Trip ID"
                        className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors group"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />}
                      </button>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`Hey! Join my trip *${activeTrip.name}* on *TripSplit Budget* to split our expenses and sync budgets in real time! ✈️💰\n\nTrip ID: *${activeTrip.id}*\n\nJoin here: https://tripsplit-budget.vercel.app`)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none h-12 px-5 flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all gap-1.5"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.117.956 11.53.956 6.095.956 1.671 5.328 1.667 10.757c-.001 1.705.452 3.369 1.31 4.837l-.859 3.136 3.226-.834zm13.111-6.196c-.332-.166-1.966-.97-2.271-1.082-.306-.112-.529-.166-.75.166-.222.332-.857 1.082-1.051 1.302-.195.221-.39.248-.722.082-.332-.166-1.401-.516-2.668-1.646-.985-.88-1.65-1.968-1.843-2.3-.193-.332-.021-.511.144-.676.15-.148.332-.387.498-.581.166-.193.221-.332.332-.553.111-.221.055-.415-.027-.581-.082-.166-.75-1.804-1.026-2.47-.27-.648-.544-.56-.75-.571-.193-.01-.415-.011-.637-.011-.222 0-.582.082-.886.415-.304.331-1.162 1.135-1.162 2.766 0 1.631 1.189 3.208 1.355 3.429.166.221 2.341 3.58 5.672 5.016.792.341 1.41.545 1.892.699.796.253 1.52.217 2.093.131.638-.095 1.966-.803 2.242-1.58.277-.777.277-1.442.194-1.58-.083-.139-.304-.221-.636-.387z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-orange-600/70 font-medium leading-relaxed">Share this ID with other nomads to have them join this trip's ledger system.</p>
                </div>

                {/* 1. Pending Requests (Only visible if there are some pending) */}
                {pendingMembers.length > 0 && (
                  <div className="space-y-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pending Join Requests ({pendingMembers.length})
                    </h4>
                    {pendingMembers.map(member => (
                      <div key={member.uid} className="flex items-center justify-between p-3 rounded-2xl bg-amber-550/5 dark:bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/25 transition-colors">
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            uid={member.uid}
                            displayName={member.displayName}
                            photoURL={member.photoURL}
                            className="w-10 h-10 font-bold border border-amber-200/50 dark:border-amber-900/30"
                          />
                          <div>
                            <p className="text-sm font-bold dark:text-white flex items-center gap-1.5">{member.displayName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwner ? (
                            <>
                              <button 
                                onClick={async () => {
                                  try {
                                    await approveMember(activeTrip.id, member.uid);
                                    toast.success(`${member.displayName || 'Member'} approved successfully!`);
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to approve member");
                                  }
                                }}
                                className="h-8 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRemoveMember(member.uid)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/15 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Awaiting Approved</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Approved Members */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Approved Members ({approvedMembers.length})</h4>
                  {approvedMembers.map(member => (
                    <div key={member.uid} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          uid={member.uid}
                          displayName={member.displayName}
                          photoURL={member.photoURL}
                          className="w-10 h-10 font-bold border border-slate-100 dark:border-slate-800"
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
                          {member.role === 'owner' ? 'Leader' : 'Traveler'}
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

      <AnimatePresence>
        {previewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setPreviewReceipt(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black mb-6 dark:text-white flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-orange-500" />
                Receipt
              </h2>
              <div className="flex justify-center w-full max-h-[60vh] overflow-auto rounded-xl">
                <img src={previewReceipt} alt="Receipt" className="max-w-full object-contain rounded-xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
