import { 
  ArrowLeft, Plus, DollarSign, PieChart as PieChartIcon, Users, Receipt, 
  Trash2, TrendingUp, ChevronRight, MapPin, Plane, CheckCircle2, Circle, Clock, Share2, Copy, Check, UserMinus, X, Filter, Calendar as CalendarIcon, Tag, User as UserIcon, Image as ImageIcon, Activity, QrCode, AlertTriangle, Camera, Loader2, Mic, Download, ExternalLink, FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTrip } from '../context/TripContext';
import { formatDate, formatCurrency, cn, formatDateTime, formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserAvatar } from './Avatar';
import { ReceiptPreview } from './ReceiptPreview';
import QRCode from 'qrcode';
