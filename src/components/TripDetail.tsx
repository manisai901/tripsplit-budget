import { 
  ArrowLeft, Plus, DollarSign, PieChart as PieChartIcon, Users, Receipt, 
  Trash2, TrendingUp, ChevronRight, ArrowRight, MapPin, Plane, CheckCircle2, Circle, Clock, Share2, Copy, Check, UserMinus, X, Filter, Calendar as CalendarIcon, Tag, User as UserIcon, Image as ImageIcon, Activity, AlertTriangle, Download, QrCode, Globe, Mic, MicOff, Camera, FileText, Loader2, ExternalLink
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTrip } from '../context/TripContext';
import { formatDate, formatCurrency, cn, formatDateTime, formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, getBytes } from 'firebase/storage';
import { UserAvatar } from './Avatar';
import QRCode from 'qrcode';

export default function TripDetail() {
  const { user } = useAuth();
  const { trips, activeTrip, expenses, checklist, members, addExpense, addChecklistItem, toggleChecklistItem, removeMember, approveMember, withdrawJoinRequest, updateChecklistItem, updateTripSettings, setActiveTripId, joinTrip, loading, deleteTrip } = useTrip();
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get('modal');

  const approvedMembers = useMemo(() => members.filter(m => m.role !== 'pending'), [members]);
  const pendingMembers = useMemo(() => members.filter(m => m.role === 'pending'), [members]);
  const currentUserMember = useMemo(() => members.find(m => m.uid === user?.uid), [members, user]);
  const isPending = currentUserMember?.role === 'pending';

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueTime, setEditingDueTime] = useState('');
  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false);
  const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null);
  const [memberToApprove, setMemberToApprove] = useState<{ uid: string; displayName: string } | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'all' | 'description' | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState('');

  const startSpeechRecognition = (target: 'all' | 'description') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Web Speech API is not supported in this browser. Try using Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    // Auto-detect lang preference or fallback to en-US for max compatibility on laptops, tabs, and desktops
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;

    setVoiceTarget(target);
    setIsListening(true);
    setVoiceError(null);
    setSpeechTranscript('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpeechTranscript(transcript);
      
      if (target === 'description') {
        setNewExpense(prev => ({
          ...prev,
          description: transcript
        }));
        toast.success(`Dictated description: "${transcript}"`);
      } else if (target === 'all') {
        const numberPattern = /\b\d+(?:\.\d+)?\b/g;
        const matches = transcript.match(numberPattern);
        let detectedAmount = 0;
        let finalDesc = transcript;

        if (matches && matches.length > 0) {
          detectedAmount = parseFloat(matches[matches.length - 1]);
        } else {
          const wordsToNumbers: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'hundred': 100
          };
          const words = transcript.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (wordsToNumbers[word] !== undefined) {
              detectedAmount = wordsToNumbers[word];
              break;
            }
          }
        }

        if (detectedAmount > 0) {
          const amountStr = String(detectedAmount);
          const regexStr = new RegExp(`\\b(${amountStr}|for|dollars|rupees|euro|cents|pounds|yen)\\b`, 'gi');
          finalDesc = transcript.replace(regexStr, '').replace(/\s+/g, ' ').trim();
          if (!finalDesc || finalDesc.length < 2) finalDesc = transcript;
        }

        let autoCategory = 'Other';
        const lowerTranscript = transcript.toLowerCase();
        if (lowerTranscript.includes('lunch') || lowerTranscript.includes('eat') || lowerTranscript.includes('breakfast') || lowerTranscript.includes('dinner') || lowerTranscript.includes('food') || lowerTranscript.includes('sushi') || lowerTranscript.includes('starbucks') || lowerTranscript.includes('coffee') || lowerTranscript.includes('cafe')) {
          if (lowerTranscript.includes('breakfast')) autoCategory = 'Breakfast';
          else if (lowerTranscript.includes('lunch')) autoCategory = 'Lunch';
          else if (lowerTranscript.includes('dinner')) autoCategory = 'Dinner';
          else autoCategory = 'Food';
        } else if (lowerTranscript.includes('taxi') || lowerTranscript.includes('uber') || lowerTranscript.includes('cab') || lowerTranscript.includes('metro') || lowerTranscript.includes('bus') || lowerTranscript.includes('train') || lowerTranscript.includes('auto') || lowerTranscript.includes('flight') || lowerTranscript.includes('ticket')) {
          if (lowerTranscript.includes('bus')) autoCategory = 'Bus';
          else if (lowerTranscript.includes('train')) autoCategory = 'Train';
          else if (lowerTranscript.includes('auto')) autoCategory = 'Auto';
          else autoCategory = 'Transport';
        } else if (lowerTranscript.includes('hotel') || lowerTranscript.includes('stay') || lowerTranscript.includes('hostel') || lowerTranscript.includes('airbnb') || lowerTranscript.includes('room')) {
          autoCategory = 'Stay';
        } else if (lowerTranscript.includes('fun') || lowerTranscript.includes('bar') || lowerTranscript.includes('club') || lowerTranscript.includes('museum') || lowerTranscript.includes('show') || lowerTranscript.includes('movie') || lowerTranscript.includes('entry') || lowerTranscript.includes('drink')) {
          autoCategory = 'Fun';
        }

        setNewExpense(prev => ({
          ...prev,
          description: finalDesc.charAt(0).toUpperCase() + finalDesc.slice(1),
          amount: detectedAmount || prev.amount,
          category: autoCategory
        }));

        toast.success(`Dictated: "${finalDesc}" with amount ${detectedAmount ? detectedAmount : 'unmatched'}`);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setVoiceError(event.error);
      toast.error(`Voice input error: ${event.error}`);
      setIsListening(false);
      setVoiceTarget(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceTarget(null);
    };

    recognition.start();
  };

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
  const [qrUrl, setQrUrl] = useState('');
  const [isShowingQRModal, setIsShowingQRModal] = useState(false);

  useEffect(() => {
    if (activeTrip?.id) {
      const inviteUrl = `${window.location.origin}/trip/${activeTrip.id}`;
      QRCode.toDataURL(inviteUrl, {
        margin: 2,
        width: 380,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(setQrUrl).catch(err => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [activeTrip?.id]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [splitOption, setSplitOption] = useState<'all' | 'custom' | 'personal'>('all');
  const [customParticipants, setCustomParticipants] = useState<string[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptStoragePath, setReceiptStoragePath] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [previewStoragePath, setPreviewStoragePath] = useState<string | null>(null);
  const [freshPreviewUrl, setFreshPreviewUrl] = useState<string | null>(null);
  const [isPreviewRefreshing, setIsPreviewRefreshing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Sync fresh URL for preview modal
  useEffect(() => {
    if (!previewReceipt && !previewStoragePath) {
      setFreshPreviewUrl(null);
      setIsPreviewRefreshing(false);
      return;
    }

    if (previewStoragePath) {
      const isLocalRef = previewReceipt && previewReceipt.startsWith('local_receipt_ref_');
      const hasLocalCopy = isLocalRef && !!localStorage.getItem(previewReceipt);
      
      if (hasLocalCopy) {
        setFreshPreviewUrl(previewReceipt);
        setIsPreviewRefreshing(false);
        return;
      }

      setIsPreviewRefreshing(true);
      const fileRef = ref(storage, previewStoragePath);
      getDownloadURL(fileRef)
        .then(url => {
          setFreshPreviewUrl(url);
          setIsPreviewRefreshing(false);
        })
        .catch(err => {
          if (err && (err.code === 'storage/retry-limit-exceeded' || String(err).includes('retry-limit-exceeded'))) {
            console.warn("Storage is offline or unprovisioned. Using local fallback for receipt preview.");
          } else {
            console.warn("Could not refresh preview URL:", err);
          }
          setFreshPreviewUrl(previewReceipt); // Fallback
          setIsPreviewRefreshing(false);
        });
    } else {
      setFreshPreviewUrl(previewReceipt);
      setIsPreviewRefreshing(false);
    }
  }, [previewReceipt, previewStoragePath]);

  // Convert/cache PDF Data as Local Blob URI for highly compatible inline view within iframes
  useEffect(() => {
    const targetUrl = freshPreviewUrl || previewReceipt;
    if (!targetUrl) {
      setPdfBlobUrl(null);
      setIsPdfLoading(false);
      return;
    }

    const isPdf = isPdfReceipt(targetUrl, previewStoragePath);
    if (!isPdf) {
      setPdfBlobUrl(null);
      setIsPdfLoading(false);
      return;
    }

    const resolved = getReceiptData(targetUrl);
    if (!resolved) {
      setPdfBlobUrl(null);
      setIsPdfLoading(false);
      return;
    }

    let active = true;
    let bUrl: string | null = null;

    setIsPdfLoading(true);

    if (resolved.startsWith('data:')) {
      try {
        const parts = resolved.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const b64 = parts[1];
        const bin = atob(b64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        bUrl = URL.createObjectURL(blob);
        if (active) {
          setPdfBlobUrl(bUrl);
          setIsPdfLoading(false);
        }
      } catch (err) {
        console.error("PDF data url blob conversion failed:", err);
        if (active) {
          setPdfBlobUrl(resolved);
          setIsPdfLoading(false);
        }
      }
    } else if (previewStoragePath) {
      // It's a cloud storage PDF! Fetch bytes via SDK to bypass iframe CORS/CSP and prevent login page redirect.
      getBytes(ref(storage, previewStoragePath))
        .then((arrayBuffer) => {
          if (!active) return;
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          bUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(bUrl);
          setIsPdfLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch PDF bytes using Storage SDK, trying fallback:", err);
          // Fallback to fetch
          fetch(resolved)
            .then(res => res.blob())
            .then(blob => {
              if (!active) return;
              bUrl = URL.createObjectURL(blob);
              setPdfBlobUrl(bUrl);
              setIsPdfLoading(false);
            })
            .catch((innerErr) => {
              console.error("Fallback fetch also failed:", innerErr);
              if (active) {
                setPdfBlobUrl(resolved);
                setIsPdfLoading(false);
              }
            });
        });
    } else {
      // Remote URL with no storage path
      fetch(resolved)
        .then(res => res.blob())
        .then(blob => {
          if (!active) return;
          bUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(bUrl);
          setIsPdfLoading(false);
        })
        .catch((err) => {
          console.error("Fetch remote URL failed:", err);
          if (active) {
            setPdfBlobUrl(resolved);
            setIsPdfLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (bUrl) {
        URL.revokeObjectURL(bUrl);
      }
    };
  }, [freshPreviewUrl, previewReceipt, previewStoragePath]);

  // Unified modal close handler that correctly pops history
  const closeModal = () => {
    if (searchParams.get('modal')) {
      navigate(-1);
    } else {
      setIsAddingExpense(false);
      setIsManagingAccess(false);
      setIsShowingQRModal(false);
      setPreviewReceipt(null);
      setMemberToRemoveId(null);
      setMemberToApprove(null);
      setIsConfirmingWithdraw(false);
    }
  };

  // Sync modal reactive states from URL (for back button support)
  useEffect(() => {
    const currentModal = searchParams.get('modal');
    
    if (!currentModal) {
      setIsAddingExpense(false);
      setIsManagingAccess(false);
      setIsShowingQRModal(false);
      setPreviewReceipt(null);
      setMemberToRemoveId(null);
      setMemberToApprove(null);
      setIsConfirmingWithdraw(false);
    } else {
      if (currentModal === 'add') setIsAddingExpense(true);
      if (currentModal === 'access') setIsManagingAccess(true);
      if (currentModal === 'qr') setIsShowingQRModal(true);
      if (currentModal === 'preview') {
        // Only set previewReceipt if not already set (prevents clearing when hitting back from another sub-modal if any)
      }
    }
  }, [searchParams]);

  // Sync state changes to URL (push history)
  useEffect(() => {
    const currentModal = searchParams.get('modal');
    
    // Check if we need to push a new state
    const targetModal = 
      isAddingExpense ? 'add' :
      isManagingAccess ? 'access' :
      isShowingQRModal ? 'qr' :
      previewReceipt ? 'preview' :
      memberToRemoveId ? 'remove-member' :
      memberToApprove ? 'approve-member' :
      isConfirmingWithdraw ? 'withdraw' : null;

    if (targetModal && currentModal !== targetModal) {
      setSearchParams({ modal: targetModal }, { replace: false });
    }
  }, [isAddingExpense, isManagingAccess, isShowingQRModal, previewReceipt, memberToRemoveId, memberToApprove, isConfirmingWithdraw]);

  const pendingUploadRef = useRef<Promise<{ url: string, path: string }> | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Local storage cache helpers to avoid bloating Firestore and getting stuck
  const saveReceiptToLocal = (key: string, base64Data: string) => {
    try {
      localStorage.setItem(key, base64Data);
    } catch (e) {
      console.warn("localStorage quota exceeded, clearing older receipts...", e);
      try {
        const keys = Object.keys(localStorage);
        const receiptKeys = keys.filter(k => k.startsWith('local_receipt_ref_'));
        receiptKeys.sort();
        const keysToRemove = receiptKeys.slice(0, Math.floor(receiptKeys.length / 2));
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, base64Data);
      } catch (innerErr) {
        console.error("Failed to write to localStorage even after cleanup", innerErr);
      }
    }
  };

  const getReceiptData = (url: string | null): string => {
    if (!url) return '';
    // Handle data URLs directly
    if (url.startsWith('data:')) return url;
    if (url.startsWith('local_receipt_ref_')) {
      return localStorage.getItem(url) || '';
    }
    return url;
  };

  const isValidPreviewUrl = (url: string | null | undefined): boolean => {
    if (!url || url === 'fetching_preview') return false;
    const resolved = getReceiptData(url);
    if (!resolved) return false;
    return resolved.startsWith('data:') || resolved.startsWith('http://') || resolved.startsWith('https://');
  };

  const isPdfReceipt = (url: string | null | undefined, storagePath?: string | null | undefined): boolean => {
    if (!url && !storagePath) return false;
    const targets: string[] = [];
    if (url) {
      targets.push(url.toLowerCase());
      if (url.startsWith('local_receipt_ref_')) {
        const localData = localStorage.getItem(url);
        if (localData) {
          targets.push(localData.toLowerCase());
        }
      }
    }
    if (storagePath) targets.push(storagePath.toLowerCase());
    
    return targets.some(target => 
      target.includes('application/pdf') || 
      target.includes('.pdf') || 
      target.includes('_pdf') ||
      target.includes('data:pdf') ||
      target.startsWith('data:application/pdf') ||
      target === 'pdf_placeholder'
    );
  };

  const handleOpenDocument = async (url: string | null, storagePath?: string | null) => {
    const targetUrl = url || freshPreviewUrl;
    if (!targetUrl && !storagePath) return;
    
    // Check if it's a PDF
    const isPdf = isPdfReceipt(targetUrl, storagePath);
    
    // If we have a direct public cloud URL and it's NOT a PDF, open immediately.
    // (PDFs are better handled via blob conversion for consistent mobile/desktop behavior)
    if (targetUrl && (targetUrl.startsWith('http') || targetUrl.startsWith('https')) && 
        !targetUrl.startsWith('local_receipt_ref_') && !isPdf) {
      const newWin = window.open(targetUrl, '_blank');
      if (!newWin) {
        toast.error("Popup blocked! Please allow popups to view documents.");
      }
      return;
    }

    // Opens a window immediately to bypass popup blockers for all other cases
    const newWin = window.open('', '_blank');
    if (!newWin) {
      toast.error("Popup blocked! Please allow popups for this site.");
      return;
    }

    // Professional loading screen inside the new tab
    newWin.document.write(`
      <html>
        <head>
          <title>Mani Traveler - Viewing Receipt</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              display: flex; flex-direction: column; align-items: center; justify-content: center; 
              height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; 
            }
            .loader { 
              border: 3px solid rgba(249, 115, 22, 0.1); border-top: 3px solid #f97316; 
              border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s ease-in-out infinite; 
              margin-bottom: 24px; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .brand { font-size: 11px; font-weight: 900; letter-spacing: 0.25em; color: #f97316; margin-bottom: 8px; text-transform: uppercase; }
            .msg { font-size: 15px; font-weight: 400; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <div class="brand">Mani Traveler Security</div>
          <div class="msg">Decrypting and streaming your receipt document...</div>
        </body>
      </html>
    `);

    let realUrl = targetUrl;
    
    // Fetch if missing, only local ref (that isn't cached), or legacy 'pdf_placeholder'
    const isLocalRef = realUrl && realUrl.startsWith('local_receipt_ref_');
    const hasLocalCopy = isLocalRef && !!localStorage.getItem(realUrl);
    
    if (storagePath && (!realUrl || (isLocalRef && !hasLocalCopy) || realUrl === 'pdf_placeholder')) {
      try {
        const fileRef = ref(storage, storagePath);
        realUrl = await getDownloadURL(fileRef);
      } catch (err: any) {
        if (err && (err.code === 'storage/retry-limit-exceeded' || String(err).includes('retry-limit-exceeded'))) {
          console.warn("Storage is offline or unprovisioned. Using local fallback for open document.");
        } else {
          console.warn("Could not get fresh download URL:", err);
        }
      }
    }

    if (!realUrl || realUrl === 'pdf_placeholder') {
      newWin.document.body.innerHTML = '<div style="color:#ef4444; font-family:sans-serif; text-align:center; padding:20px;">Receipt not found. Link may have expired.</div>';
      setTimeout(() => newWin.close(), 3000);
      toast.error("Document link expired.");
      return;
    }
    
    const realData = getReceiptData(realUrl);
    const finalIsPdf = isPdfReceipt(realUrl, storagePath);

    if (finalIsPdf) {
      if (realData.startsWith('data:')) {
        try {
          const parts = realData.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
          const b64 = parts[1];
          
          const bin = atob(b64);
          const len = bin.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = bin.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          newWin.location.replace(blobUrl);
        } catch (err) {
          console.error("PDF Blob conversion failed", err);
          newWin.location.replace(realData);
        }
      } else if (storagePath) {
        try {
          const arrayBuffer = await getBytes(ref(storage, storagePath));
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          newWin.location.replace(blobUrl);
        } catch (err) {
          console.error("Failed to fetch PDF bytes using Storage SDK for popup:", err);
          try {
            const res = await fetch(realData);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            newWin.location.replace(blobUrl);
          } catch (innerErr) {
            console.error("Fallback fetch also failed, falling back to direct URL:", innerErr);
            newWin.location.replace(realData);
          }
        }
      } else {
        try {
          const res = await fetch(realData);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          newWin.location.replace(blobUrl);
        } catch (err) {
          console.error("Fetch of remote URL failed for popup, falling back to direct URL:", err);
          newWin.location.replace(realData);
        }
      }
    } else {
      newWin.location.replace(realData);
    }
  };

  // PDF Document and camera upload states and refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
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
  const canEdit = isOwner || (activeTrip?.allowTravellerEdits !== false && currentUserMember?.role === 'editor');

  // Camera stream cleanup on unmount or stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file); // PDF or other document format
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800; // Optimal width for fast receipts upload
          const MAX_HEIGHT = 800; // Optimal height for fast receipts upload
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.65); // 65% quality is highly compressed yet extremely readable
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!activeTrip) return;
    setReceiptFileName(file.name);
    
    const isPdf = !file.type.startsWith('image/') || file.name.slice(-4).toLowerCase() === '.pdf';
    const fileExt = isPdf ? 'pdf' : 'jpg';
    const storagePath = `trips/${activeTrip.id}/receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // 1. Set the storage path immediately so it can be saved with the expense
    setReceiptStoragePath(storagePath);
    
    // 2. Show instant preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const localKey = `local_receipt_ref_${Date.now()}`;
      saveReceiptToLocal(localKey, reader.result as string);
      setReceiptImage(localKey);
    };
    reader.readAsDataURL(file);

    // 3. Background upload - completely non-blocking but tracks status
    setIsUploadingFile(true);
    (async () => {
      try {
        const uploadFile = isPdf ? file : await compressImage(file);
        const fileRef = ref(storage, storagePath);
        
        // Using resumable for better reliability
        const uploadTask = uploadBytesResumable(fileRef, uploadFile, { 
          contentType: isPdf ? 'application/pdf' : 'image/jpeg' 
        });

        // Create a wrapper promise so we can track it if needed
        pendingUploadRef.current = new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            null,
            (error) => {
              if (error && (error.code === 'storage/retry-limit-exceeded' || String(error).includes('retry-limit-exceeded'))) {
                console.warn("Storage upload task failed (offline/unprovisioned storage):", error);
              } else {
                console.error("Storage upload task failed:", error);
              }
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(fileRef);
                setReceiptImage(url);
                resolve({ url, path: storagePath });
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        await pendingUploadRef.current;
      } catch (err: any) {
        if (err && (err.code === 'storage/retry-limit-exceeded' || String(err).includes('retry-limit-exceeded'))) {
          console.warn("Background upload failed (offline/unprovisioned storage):", err);
        } else {
          console.error("Background upload failed:", err);
          toast.error("Cloud document sync failed. Using local copy for now.");
        }
      } finally {
        setIsUploadingFile(false);
        pendingUploadRef.current = null;
      }
    })();
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera streaming failed, using direct device camera capture fallback:", err);
      // Fallback: trigger hidden native camera capture element
      cameraInputRef.current?.click();
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileUpload(file);
          }
          stopCamera();
        }, 'image/jpeg', 0.85);
      }
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    if (!canEdit) {
      toast.error('This ledger is locked for editing by the Trip Leader');
      return;
    }
    
    const finalCategory = newExpense.category === 'Other' ? (customCategory || 'Other') : newExpense.category;
    const now = new Date();
    const defaultTime = formatTime(now); // Requires 'formatTime' import if not already
    const selectedPayerId = newExpense.payerId || user?.uid;
    const selectedPayerName = members.find(m => m.uid === selectedPayerId)?.displayName || user?.displayName || 'Unknown';
    
    // Ensure at least one participant is selected if custom
    let participants: string[] = [];
    if (splitOption === 'all') {
      participants = activeTrip.members;
    } else if (splitOption === 'personal') {
      participants = selectedPayerId ? [selectedPayerId] : [];
    } else {
      participants = customParticipants;
    }
    
    if (participants.length === 0) {
      participants = activeTrip.members; // fallback
    }
    
    let finalReceiptUrl = receiptImage;
    const finalStoragePath = receiptStoragePath;

    if (pendingUploadRef.current) {
      const waitToast = toast.loading("Finalizing cloud sync...");
      try {
        const result = await pendingUploadRef.current;
        finalReceiptUrl = result.url;
        toast.dismiss(waitToast);
      } catch (err: any) {
        if (err && (err.code === 'storage/retry-limit-exceeded' || String(err).includes('retry-limit-exceeded'))) {
          console.warn("Pending upload wait failed (offline/unprovisioned storage):", err);
        } else {
          console.error("Pending upload wait failed:", err);
        }
        toast.dismiss(waitToast);
      }
    }

    // Try to pre-resolve direct cloud URL if only path is set or we have placeholders
    if (finalStoragePath && (!finalReceiptUrl || finalReceiptUrl.startsWith('local_receipt_ref_') || finalReceiptUrl === 'pdf_placeholder')) {
      try {
        finalReceiptUrl = await getDownloadURL(ref(storage, finalStoragePath));
      } catch (err) {
        console.warn("Could not get final receipt URL pre-save:", err);
      }
    }

    if (finalReceiptUrl && finalReceiptUrl.startsWith('local_receipt_ref_')) {
      const base64Data = localStorage.getItem(finalReceiptUrl);
      if (base64Data) {
        finalReceiptUrl = base64Data;
      } else {
        finalReceiptUrl = null;
      }
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
      ...(finalReceiptUrl ? { receiptUrl: finalReceiptUrl } : {}),
      ...(finalStoragePath ? { receiptStoragePath: finalStoragePath } : {})
    });
    closeModal();
    setSplitOption('all');
    setCustomParticipants([]);
    setReceiptImage(null);
    setReceiptStoragePath(null);
    setReceiptFileName(null);
    setNewExpense({ description: '', amount: 0, category: 'Food', date: new Date().toISOString().split('T')[0], time: '', payerId: user?.uid || '' });
    setCustomCategory('');
  };

  const handleAddCheckItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !newCheckItem.trim()) return;
    if (!canEdit) {
      toast.error('This ledger is locked for editing by the Trip Leader');
      return;
    }
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

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemoveId(memberId);
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

  if (activeTrip && isPending) {
    const leader = members.find(m => m.uid === activeTrip.ownerId) || members.find(m => m.role === 'owner');
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle colored background blurs */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 dark:bg-amber-500/5 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-orange-500/10 dark:bg-orange-500/5 blur-3xl rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Pulsing state visual */}
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-amber-500/20 dark:border-amber-500/10 animate-ping" />
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Waiting Room Lobby
            </h2>
            <p className="text-xs text-amber-500 font-extrabold uppercase tracking-[0.2em] mb-6">
              Awaiting Trip Leader Approval
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 mb-8 text-left space-y-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Journey Destination</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  {activeTrip.destination || 'Unspecified Location'}
                </span>
              </div>
              
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Trip Name</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  {activeTrip.name}
                </span>
              </div>

              {leader && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Trip Leader</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{leader.displayName}</span>
                  </div>
                  <UserAvatar 
                    uid={leader.uid}
                    displayName={leader.displayName}
                    photoURL={leader.photoURL}
                    className="w-8 h-8 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
              Standard real-time logistics, collaborative budgets, settlement history, and checklists will unlock immediately once approved by the Trip Leader.
            </p>

            <div className="flex flex-col gap-3 w-full">
              {isConfirmingWithdraw ? (
                <div className="bg-red-500/5 dark:bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex flex-col gap-3 items-center">
                  <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">Confirm leaving this trip?</span>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={async () => {
                        await withdrawJoinRequest(activeTrip.id);
                        navigate('/');
                      }}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Yes, Withdraw Request
                    </button>
                    <button
                      onClick={() => closeModal()}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingWithdraw(true)}
                  className="w-full py-3 bg-red-400 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm"
                >
                  Withdraw Request & Exit
                </button>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 min-h-screen">
      <div className="sticky top-[56px] md:top-[64px] z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Back</span>
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <h1 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-tight truncate max-w-[200px] md:max-w-md">
            {activeTrip.name}
          </h1>
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 rounded-full text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsShowingQRModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 hover:scale-[1.02]"
             title="Show QR Code Invite"
           >
             <QrCode className="w-3.5 h-3.5 text-orange-500" />
             <span>Scan Invite</span>
           </button>
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



      {/* Header Stat Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8">
          <div className="stat-gradient p-6 md:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="relative z-10 w-full">
              <div className="mb-4 flex animate-fade-in">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-white border border-white/15 backdrop-blur-sm flex items-center gap-1">
                  📍 {activeTrip.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1 opacity-90">
                <span className="text-xs md:text-sm">💰</span>
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">TOTAL SPENT</span>
              </div>
              <h2 className="text-3.5xl md:text-6xl font-black tracking-tight mb-2 select-all text-white leading-none">
                {formatCurrency(totalSpent, activeTrip.currency)}
              </h2>
              <p className="text-xs md:text-sm font-medium opacity-85 mb-6">
                of {formatCurrency(activeTrip.budget, activeTrip.currency)} budget · {approvedMembers.length} {approvedMembers.length === 1 ? 'member' : 'members'}
              </p>

              <div className="w-full">
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
                
                <div className="flex justify-between items-center text-[10px] font-bold mt-2.5 uppercase tracking-widest opacity-95">
                  <span>{Math.round(progressPercent)}% used</span>
                  <span>
                    {totalSpent > (activeTrip?.budget || 0) ? (
                      <span className="text-red-200 font-extrabold">{formatCurrency(totalSpent - (activeTrip?.budget || 0), activeTrip.currency)} over budget</span>
                    ) : (
                      <span>{formatCurrency((activeTrip?.budget || 0) - totalSpent, activeTrip.currency)} remaining</span>
                    )}
                  </span>
                </div>
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

              {/* Live Budget Sync Plans */}
              <div className="flex gap-2.5 mt-6 flex-wrap">
                {/* Per Person Card */}
                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex flex-col justify-center min-w-[110px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <span className="text-base md:text-xl font-black text-white leading-none">
                    {formatCurrency(totalSpent / (approvedMembers.length || 1), activeTrip.currency)}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 mt-1">PER PERSON</span>
                </div>

                {/* Members Card */}
                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex flex-col justify-center min-w-[100px]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <span className="text-base md:text-xl font-black text-white leading-none">
                    {approvedMembers.length}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 mt-1">MEMBERS</span>
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
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{approvedMembers.length} Members</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex items-center justify-between border border-purple-100/50 dark:border-purple-800/30">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Parity Share</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-purple-900 dark:text-purple-200 block">{formatCurrency(totalSpent / (approvedMembers.length || 1), activeTrip.currency)}</span>
                </div>
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
                  placeholder={isPending ? "Pending Leader confirmation..." : (!canEdit ? "🔒 Read-only: locked by Leader" : "Add a mission objective...")}
                  value={newCheckItem}
                  disabled={isPending || !canEdit}
                  onChange={e => setNewCheckItem(e.target.value)}
                  className="flex-1 h-14 md:h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 text-base md:text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white disabled:opacity-60"
                  style={{ height: '20.4844px', width: '277.789px' }}
                />
                <input 
                  type="time" 
                  value={newCheckTime}
                  disabled={isPending || !canEdit}
                  onChange={e => setNewCheckTime(e.target.value)}
                  className="w-full sm:w-36 h-14 md:h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base md:text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all dark:text-white disabled:opacity-60"
                />
              </div>
              <button disabled={!newCheckItem || isPending || !canEdit} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 h-14 md:h-12 rounded-xl text-sm md:text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
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
                        if (!canEdit) {
                          toast.error('This ledger is locked for editing by the Trip Leader');
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
                                    Closed by {item.completedByName || 'Member'} @ {item.completedAt?.toDate ? formatDateTime(item.completedAt.toDate()) : 'Now'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Option to modify: 1 time only if not completed and not pending and hasn't been modified yet */}
                          {!item.completed && !isPending && canEdit && (
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

      <div className="grid lg:grid-cols-12 gap-8 w-full overflow-hidden">
        {/* Expenses Table Section */}
        <div className="lg:col-span-8 w-full min-w-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col w-full max-w-full">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 shrink-0 w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest truncate">Transaction Records</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">Verified expenses for all members.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0 w-full sm:w-auto">
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
                   {canEdit ? (
                    <button 
                      onClick={() => setIsAddingExpense(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      + Add Record
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3.5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      🔒 Read-Only
                    </span>
                  )}
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
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center font-bold text-xl border border-orange-100/50 dark:border-orange-900/20 group-hover:scale-110 transition-transform shrink-0">
                          {expense.category === 'Food' ? '🍕' : expense.category === 'Transport' ? '🛥️' : expense.category === 'Stay' ? '🏨' : expense.category === 'Fun' ? '🎡' : '💸'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex flex-wrap items-center gap-2 leading-tight break-words">
                            {expense.description}
                             {(expense.receiptUrl || expense.receiptStoragePath) && (
                            <button 
                              onClick={() => {
                                setPreviewReceipt(expense.receiptUrl || 'fetching_preview');
                                setPreviewStoragePath(expense.receiptStoragePath);
                              }}
                              className="text-slate-400 hover:text-orange-500 transition-colors"
                              title={isPdfReceipt(expense.receiptUrl, expense.receiptStoragePath) ? "View PDF Document" : "View Image Receipt"}
                            >
                              {isPdfReceipt(expense.receiptUrl, expense.receiptStoragePath) ? (
                                <FileText className="w-4 h-4 text-rose-500 hover:scale-110 transition-all" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-emerald-500 hover:scale-110 transition-all" />
                              )}
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
                          {expense.participants && expense.participants.length === 1 && expense.participants[0] === expense.payerId ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Personal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Shared with {expense.participants?.length || activeTrip?.members?.length || 0}
                            </span>
                          )}
                           {(expense.receiptUrl || expense.receiptStoragePath) && (
                            <button 
                              onClick={() => {
                                setPreviewReceipt(expense.receiptUrl || 'fetching_preview');
                                setPreviewStoragePath(expense.receiptStoragePath);
                              }}
                              className={isPdfReceipt(expense.receiptUrl, expense.receiptStoragePath)
                                ? "px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-rose-100 dark:border-rose-900/10 hover:scale-105"
                                : "px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-emerald-100 dark:border-emerald-900/10 hover:scale-105"
                              }
                              title={isPdfReceipt(expense.receiptUrl, expense.receiptStoragePath) ? "Click to view PDF receipt details" : "Click to view image receipt details"}
                            >
                              {isPdfReceipt(expense.receiptUrl, expense.receiptStoragePath) ? (
                                <>
                                  <FileText className="w-2.5 h-2.5 text-rose-500" /> PDF Receipt
                                </>
                              ) : (
                                <>
                                  <Receipt className="w-2.5 h-2.5 text-emerald-500" /> View Receipt
                                </>
                              )}
                            </button>
                          )}
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

        <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          {/* Detailed Members List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 w-full">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Active Members</h3>
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
                  <div key={member.uid} className="flex items-center justify-between group w-full overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar 
                          uid={member.uid}
                          displayName={member.displayName}
                          photoURL={member.photoURL}
                          className="w-10 h-10 font-bold border-2 border-white dark:border-slate-800 shadow-sm"
                        />
                        {member.lastActive && (Date.now() - member.lastActive) < 40000 ? (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" title="Active now" />
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900 rounded-full" title="Offline" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{member.displayName}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider truncate",
                          member.role === 'owner' ? "text-orange-500" : "text-slate-400"
                        )}>
                          {member.role === 'owner' ? 'Trip Leader' : 'Traveler'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 ml-2">
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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 pb-2 shrink-0">
                <h2 className="text-2xl font-black dark:text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-orange-500" />
                    Track Expense
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </h2>
              </div>
              
              <form onSubmit={handleAddExpense} className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-5 scrollbar-hide">
                  {/* Hands-free Voice Logger Banner */}
                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-500 shrink-0">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Hands-free Logger</h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">Log expense in one sentence</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => isListening && voiceTarget === 'all' ? null : startSpeechRecognition('all')}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 shrink-0",
                        isListening && voiceTarget === 'all'
                          ? "bg-red-500 text-white animate-pulse scale-95"
                          : "bg-slate-900 dark:bg-orange-500 hover:scale-[1.02] active:scale-95 text-white"
                      )}
                    >
                      {isListening && voiceTarget === 'all' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Record Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real-time transcription display and custom tip helper */}
                  {isListening && voiceTarget === 'all' ? (
                    <div className="mt-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 font-mono text-center flex flex-col gap-1.5">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500 animate-pulse">Speak now...</span>
                      <p className="italic text-slate-400">"{speechTranscript || 'Listening for your voice...'}"</p>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500">Say description and numeric value together.</span>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 text-[9px] text-slate-400 dark:text-slate-500">
                      <p className="font-bold uppercase tracking-widest text-[8px] text-slate-500 dark:text-slate-400 mb-1">💡 Voice Log Command Tips</p>
                      <div className="grid grid-cols-2 gap-2 text-left font-mono">
                        <div>🗣️ <span className="text-slate-600 dark:text-slate-300">"Taxi to airport 450"</span></div>
                        <div>🗣️ <span className="text-slate-600 dark:text-slate-300">"Uber ride thirty"</span></div>
                        <div>🗣️ <span className="text-slate-600 dark:text-slate-300">"Dinner team 120"</span></div>
                        <div>🗣️ <span className="text-slate-600 dark:text-slate-300">"Breakfast coffee 15"</span></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                    <button
                      type="button"
                      onClick={() => isListening && voiceTarget === 'description' ? null : startSpeechRecognition('description')}
                      className={cn(
                        "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all",
                        isListening && voiceTarget === 'description'
                          ? "bg-red-500 border-red-500 text-white animate-pulse"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                      title="Dictate Description only"
                    >
                      <Mic className="w-2.5 h-2.5" />
                      <span>{isListening && voiceTarget === 'description' ? 'Listening...' : 'Dictate'}</span>
                    </button>
                  </div>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Sushi Feast @ Tsukiji"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all dark:text-white text-sm"
                  />
                  {isListening && voiceTarget === 'description' && (
                    <p className="text-[9px] text-orange-500 italic mt-1 animate-pulse">Dictating: "{speechTranscript || 'waiting for voice...'}"</p>
                  )}
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
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 pt-2">Receipt Document or Photo (Optional)</label>
                  
                  {isCameraActive ? (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center pb-4 gap-4">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md transition-all active:scale-95"
                          >
                            Capture Photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="h-10 px-5 bg-slate-800 border border-slate-600 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md transition-all active:scale-95 hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        {/* Hidden Inputs */}
                        <input 
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        <input 
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          ref={cameraInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />

                        {/* Upload Trigger Buttons */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Attach Document / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={startCamera}
                          className="h-12 w-12 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors flex items-center justify-center"
                          title="Attach from Camera"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Display Uploading Status or Preview */}
                      {isUploadingFile && (
                        <div className="flex items-center gap-2 text-xs text-orange-500 font-bold uppercase tracking-widest pl-1 mt-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      )}

                      {receiptImage && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white">
                          <div 
                            className="flex items-center gap-2.5 min-w-0 font-medium cursor-pointer group/preview"
                            onClick={() => {
                              setPreviewReceipt(receiptImage);
                              setPreviewStoragePath(receiptStoragePath);
                            }}
                          >
                            {isPdfReceipt(receiptImage, receiptStoragePath) || receiptFileName?.toLowerCase().includes('.pdf') ? (
                              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center border border-red-100/50 dark:border-red-900/20 text-red-500 shrink-0 group-hover/preview:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-755 bg-black group-hover/preview:scale-110 transition-transform">
                                <img src={getReceiptData(receiptImage) || undefined} alt="Receipt preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="text-xs font-bold truncate pr-3 max-w-[180px] dark:text-white group-hover/preview:text-orange-500 transition-colors">
                              {receiptFileName || "Attached Receipt"}
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setReceiptImage(null);
                              setReceiptFileName(null);
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                  <div 
                    className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 overflow-x-auto scrollbar-hide"
                    style={{ height: '51.9141px' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOption('all');
                        setCustomParticipants([]);
                      }}
                      className={cn(
                        "flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all",
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
                        "flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all",
                        splitOption === 'custom' 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Select Members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitOption('personal');
                        setCustomParticipants([]);
                      }}
                      className={cn(
                        "flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all",
                        splitOption === 'personal' 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Personal Expense
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
                
                </div>
                
                <div 
                  className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 flex gap-3 overflow-x-auto scrollbar-hide"
                  style={{ width: '321.758px', height: '121.207px', maxWidth: '100%' }}
                >
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-12 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploadingFile}
                    className="flex-[2] h-12 rounded-xl font-black bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {isUploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        Add Record
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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
              onClick={closeModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <div>
                  <h2 className="text-lg font-black dark:text-white">Trip Control</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage member access and invitations</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
                          closeModal();
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
                  <p className="mt-3 text-[10px] text-orange-600/70 font-medium leading-relaxed mb-4">Share this ID with other nomads to have them join this trip's ledger system.</p>
                  
                  {isOwner && (
                    <>
                      <div className="mt-4 pt-4 border-t border-orange-100 dark:border-orange-500/10 flex items-center justify-between">
                        <div className="pr-4">
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-0.5">Traveler Write Settings</span>
                          <span className="text-[9px] text-slate-400 font-medium block leading-relaxed">
                            Allow joined travelers to add expenses, make checklist updates, and modify objectives.
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            const newVal = activeTrip.allowTravellerEdits !== false ? false : true;
                            await updateTripSettings(activeTrip.id, { allowTravellerEdits: newVal });
                          }}
                          className={cn(
                            "px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 border",
                            activeTrip.allowTravellerEdits !== false
                              ? "bg-slate-900 dark:bg-orange-600 text-white border-transparent"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          )}
                        >
                          {activeTrip.allowTravellerEdits !== false ? "Editor" : "Read-Only"}
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-950/20 flex items-center justify-between">
                        <div className="pr-4">
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-0.5">Danger Zone</span>
                          <span className="text-[9px] text-slate-400 font-medium block leading-relaxed">
                            Permanently delete this trip if it contains no expense records.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this trip? This action is irreversible.")) {
                              await deleteTrip(activeTrip.id);
                              navigate('/');
                            }
                          }}
                          className="px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 transition-all shadow-sm shrink-0"
                        >
                          Delete Trip
                        </button>
                      </div>
                    </>
                  )}
                  
                  {qrUrl && (
                    <div className="mt-4 pt-4 border-t border-orange-100 dark:border-orange-500/10 flex flex-col items-center">
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-orange-100 max-w-[150px]">
                        <img src={qrUrl} alt="Trip QR Code" className="w-[126px] h-auto select-none" />
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-center mt-2.5">Point phone camera to join instantly</p>
                      
                      <a 
                        href={qrUrl} 
                        download={`tripsplit-qr-${activeTrip.name.toLowerCase().replace(/\s+/g, '-')}.png`}
                        className="mt-2 text-[10px] font-bold uppercase tracking-wider text-orange-500 hover:text-orange-600 flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download QR Image
                      </a>
                    </div>
                  )}
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
                                onClick={() => {
                                  setMemberToApprove({ uid: member.uid, displayName: member.displayName || 'Traveler' });
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
                        <div className="relative">
                          <UserAvatar 
                            uid={member.uid}
                            displayName={member.displayName}
                            photoURL={member.photoURL}
                            className="w-10 h-10 font-bold border border-slate-100 dark:border-slate-800"
                          />
                          {member.lastActive && (Date.now() - member.lastActive) < 40000 ? (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" title="Active now" />
                          ) : (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900 rounded-full" title="Offline" />
                          )}
                        </div>
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md scroll-smooth transition-all overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col"
            >
              <button 
                onClick={() => setPreviewReceipt(null)}
                className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-all active:scale-90 hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-black dark:text-white flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shadow-inner">
                      {isPdfReceipt(previewReceipt, previewStoragePath) ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mb-1">Document Evidence</p>
                      Receipt Details
                    </div>
                  </h2>
                </div>

                <div className="flex flex-col gap-6 flex-1 min-h-0">
                  <div className="flex-1 flex justify-center w-full min-h-[350px] overflow-auto rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-2 relative">
                    {isPreviewRefreshing ? (
                      <div className="flex flex-col items-center justify-center p-12 text-center w-full">
                        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Refreshing Secure URL...</p>
                      </div>
                    ) : isPdfReceipt(freshPreviewUrl || previewReceipt, previewStoragePath) ? (
                      <div className="w-full h-full flex flex-col relative min-h-[450px]">
                        {isPdfLoading && !pdfBlobUrl && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 z-20 rounded-2xl">
                            <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Decrypting & Streaming PDF...</p>
                          </div>
                        )}
                        <iframe 
                          src={pdfBlobUrl || getReceiptData(freshPreviewUrl || previewReceipt) || undefined} 
                          className="w-full h-full flex-1 rounded-2xl border-0 overflow-hidden shadow-inner bg-white dark:bg-slate-900"
                          title="PDF Receipt Viewer"
                          style={{ width: '100%', height: '100%' }}
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                          <button 
                            type="button"
                            onClick={() => handleOpenDocument(freshPreviewUrl || previewReceipt, previewStoragePath)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold cursor-pointer border-0"
                            title="Open in Native Viewer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Fullscreen View
                          </button>
                        </div>
                      </div>
                    ) : !isValidPreviewUrl(freshPreviewUrl || previewReceipt) ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 w-full">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider">No Preview Available</p>
                        <p className="text-[10px] mt-2 max-w-[200px]">The receipt is not cached locally. Click "View Original" to open in a new browser tab.</p>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={getReceiptData(freshPreviewUrl || previewReceipt) || undefined} 
                          alt="Receipt" 
                          className="max-w-full h-auto object-contain rounded-2xl shadow-sm"
                          onError={(e) => {
                            console.warn("Receipt image load failed");
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = "flex flex-col items-center justify-center p-8 text-center text-slate-400";
                              errorDiv.innerHTML = `
                                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                </div>
                                <p class="text-xs font-bold uppercase tracking-wider">Image Load Failed</p>
                                <p class="text-[10px] mt-2 max-w-[200px]">The document could not be loaded as an image. Try opening it in a new tab.</p>
                              `;
                              parent.appendChild(errorDiv);
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Verified by Trip Security
                    </p>
                    <button 
                      onClick={() => handleOpenDocument(freshPreviewUrl || previewReceipt, previewStoragePath)}
                      className="group text-[10px] font-black text-orange-500 hover:text-orange-600 transition-all flex items-center gap-2 cursor-pointer py-2 px-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    >
                      View Original <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Invitation Modal */}
      <AnimatePresence>
        {isShowingQRModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsShowingQRModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 text-center max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                <div className="text-left">
                  <h2 className="text-base font-black dark:text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-orange-500" />
                    Trip Invitation
                  </h2>
                </div>
                <button 
                  onClick={() => setIsShowingQRModal(false)} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 md:p-8 flex flex-col items-center">
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-1">Instant Scan Core</span>
                <h3 className="text-lg font-black text-slate-950 dark:text-white leading-snug mb-1">
                  "{activeTrip.name}"
                </h3>
                {activeTrip.destination && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-5">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    <span>{activeTrip.destination}</span>
                  </div>
                )}

                <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 md:max-w-[240px] flex items-center justify-center">
                  {qrUrl ? (
                    <img 
                      src={qrUrl} 
                      alt="Trip Invite QR Code" 
                      className="w-full h-auto select-none rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                  Scan to Join Ledger
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] text-center mb-6">
                  Point any smartphone camera at this code to join splits and verify expenses instantly.
                </p>

                <div className="w-full space-y-2">
                  {qrUrl && (
                    <a 
                      href={qrUrl} 
                      download={`tripsplit-qr-${activeTrip.name.toLowerCase().replace(/\s+/g, '-')}.png`}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      Save QR Image
                    </a>
                  )}

                  <button 
                    onClick={copyTripId}
                    className="w-full h-11 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied Trip ID!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Trip ID instead
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {memberToRemoveId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setMemberToRemoveId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-4">
                <UserMinus className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Remove Member</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2 mb-6">
                Are you sure you want to remove{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  {members.find(m => m.uid === memberToRemoveId)?.displayName || 'this member'}
                </span>{" "}
                from this expedition ledger? All joint calculations will be dynamically updated.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setMemberToRemoveId(null)}
                  className="flex-1 h-12 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    await removeMember(activeTrip.id, memberToRemoveId);
                    setMemberToRemoveId(null);
                  }}
                  className="flex-1 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Yes, Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Member Role Picker Modal */}
      <AnimatePresence>
        {memberToApprove && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setMemberToApprove(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Configure Traveler Access</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Select permissions for {memberToApprove.displayName}
                  </p>
                </div>
                <button 
                  onClick={() => setMemberToApprove(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3.5 mb-6">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await approveMember(activeTrip.id, memberToApprove.uid, 'editor');
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setMemberToApprove(null);
                    }
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-none mb-1">
                      Editor Mode
                      <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.5 rounded">Full Access</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                      Can write & view everything. Fully edit joint expenses, check off collaborative tasks, and manage checklists.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await approveMember(activeTrip.id, memberToApprove.uid, 'viewer');
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setMemberToApprove(null);
                    }
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-none mb-1">
                      Viewer Mode
                      <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">Read-Only</span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                      Just to see. View live budgets, settlement calculations, history, and real-time objectives without permission to modify.
                    </p>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setMemberToApprove(null)}
                className="w-full h-12 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
