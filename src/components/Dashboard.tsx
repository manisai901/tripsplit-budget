import { Plus, MapPin, Calendar, Users, ArrowRight, Wallet, ChevronRight, UserPlus, Link as LinkIcon, AlertTriangle, ExternalLink, HelpCircle, MessageCircle } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { formatDate, formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { trips, createTrip, joinTrip, setActiveTripId, indexErrorUrl, isIndexBuilding } = useTrip();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [newTrip, setNewTrip] = useState({ name: '', destination: '', budget: 0, currency: 'INR' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createTrip(newTrip);
    setIsCreating(false);
    setNewTrip({ name: '', destination: '', budget: 0, currency: 'INR' });
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    await joinTrip(joinId.trim());
    setIsJoining(false);
    setJoinId('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-24 min-h-screen">
      {indexErrorUrl && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-8 p-4 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4",
            isIndexBuilding 
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isIndexBuilding 
                ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400"
            )}>
              {isIndexBuilding ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <AlertTriangle className="w-5 h-5" />
                </motion.div>
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className={cn(
                "text-sm font-bold",
                isIndexBuilding ? "text-blue-900 dark:text-blue-200" : "text-amber-900 dark:text-amber-200"
              )}>
                {isIndexBuilding ? "Database Index Provisioning" : "Database Index Required"}
              </h4>
              <p className={cn(
                "text-[10px] font-medium leading-relaxed",
                isIndexBuilding ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400"
              )}>
                {isIndexBuilding 
                  ? "Your data views are being prepared. This usually takes 1-2 minutes by Firebase. The page will update automatically when ready." 
                  : "To sort your journeys by date, please click the button to the right to create a required composite index in your Firebase Console."}
              </p>
            </div>
          </div>
          {!isIndexBuilding && (
            <a 
              href={indexErrorUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
            >
              Create Index
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {isIndexBuilding && (
            <div className="flex items-center gap-2 px-6 py-3 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-xl">
              Building...
            </div>
          )}
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Trip Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">My Journeys</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsJoining(true)}
            className="flex-1 md:flex-none border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-5 py-3 md:py-2.5 rounded-full text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join with ID</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex-1 md:flex-none bg-slate-900 dark:bg-orange-600 text-white px-5 py-3 md:py-2.5 rounded-full text-xs font-semibold hover:bg-slate-800 dark:hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trip</span>
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No trips found</h3>
          <p className="text-xs text-slate-400 mb-6 font-medium">Start your first adventure today!</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="text-xs font-bold text-orange-500 uppercase tracking-widest hover:underline"
            >
              Create &rarr;
            </button>
            <button 
              onClick={() => setIsJoining(true)}
              className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:underline"
            >
              Join &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip, idx) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="group cursor-pointer"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full relative">
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Budget</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(trip.budget, trip.currency)}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1 group-hover:text-orange-500 transition-colors line-clamp-2">{trip.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-6">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.destination || 'Global'}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {trip.members.slice(0, 3).map((uid, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} alt="" className="w-full h-full" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {trip.members.length} Members
                      </span>
                    </div>
                    
                    <button className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
                      Explore <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Join Modal */}
      {isJoining && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsJoining(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
              <LinkIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Join a Trip</h2>
            <p className="text-sm text-slate-400 mb-6 font-medium">Enter the Secret Trip ID provided by your friend to join the expedition.</p>
            <form onSubmit={handleJoin} className="space-y-4">
              <input 
                required
                type="text" 
                placeholder="Paste Trip ID here..."
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
              <button 
                type="submit"
                className="w-full h-12 rounded-xl font-bold bg-slate-900 dark:bg-blue-600 text-white shadow-lg transition-all active:scale-95"
              >
                Sync with Group
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsCreating(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
          >
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Plan New Journey</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Journey Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Kyoto 2024"
                  value={newTrip.name}
                  onChange={e => setNewTrip({...newTrip, name: e.target.value})}
                  className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Locality</label>
                  <input 
                    type="text" 
                    placeholder="Japan"
                    value={newTrip.destination}
                    onChange={e => setNewTrip({...newTrip, destination: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Max Spend</label>
                  <input 
                    type="number" 
                    placeholder="2500"
                    value={newTrip.budget || ''}
                    onChange={e => setNewTrip({...newTrip, budget: Number(e.target.value)})}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-orange-500 text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
        <p>&copy; {new Date().getFullYear()} JourneyTracker.</p>
        <div className="flex items-center gap-4 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
          <Link 
            to="/help"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors uppercase tracking-widest font-bold"
          >
            How to use
          </Link>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
          <Link 
            to="/contact"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors uppercase tracking-widest font-bold"
          >
            Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
