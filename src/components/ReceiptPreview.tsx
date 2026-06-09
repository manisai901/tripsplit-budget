import { FileText, ImageIcon, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface ReceiptPreviewProps {
  receiptUrl: string | null;
  receiptStoragePath?: string | null;
  description: string;
  isPdfReceipt: (url: string | null) => boolean;
  getReceiptData: (url: string | null) => string;
  onViewReceipt: () => void;
  onOpenDocument: () => void;
  isCompact?: boolean;
}

export function ReceiptPreview({
  receiptUrl,
  description,
  isPdfReceipt,
  getReceiptData,
  onViewReceipt,
  onOpenDocument,
  isCompact = false
}: ReceiptPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [receiptUrl]);

  if (!receiptUrl) return null;

  const isPdf = isPdfReceipt(receiptUrl);
  const receiptData = getReceiptData(receiptUrl);

  if (isCompact) {
    // Compact view for transaction list
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={isPdf ? onOpenDocument : onViewReceipt}
        className="relative group"
        title={isPdf ? "View PDF Receipt" : "View Image Receipt"}
      >
        {isPdf ? (
          <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 flex items-center justify-center border border-red-200 dark:border-red-900/30 hover:border-red-400 dark:hover:border-red-700 transition-colors shadow-sm">
            <FileText className="w-7 h-7 text-red-500" />
          </div>
        ) : (
          <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shadow-sm group-hover:shadow-md transition-shadow">
            {!imageLoaded && !imageError && (
              <div className="w-full h-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
            )}
            {!imageError ? (
              <img 
                src={receiptData} 
                alt={`Receipt: ${description}`}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-500" />
              </div>
            )}
          </div>
        )}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
          <ExternalLink className="w-3 h-3 text-white" />
        </div>
      </motion.button>
    );
  }

  // Full view for modal preview
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/20"
    >
      {isPdf ? (
        <div className="flex flex-col items-center justify-center p-8 text-center w-full min-h-[300px] bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Secure PDF Receipt Document</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs leading-relaxed">
            Modern secure browsers prevent loading PDF files inside sandbox frames. Open the document in a new window to view safely.
          </p>
          <button 
            onClick={onOpenDocument}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center gap-2 active:scale-95"
          >
            Open PDF in New Tab <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full max-h-[50vh] overflow-auto rounded-xl bg-black">
          {!imageLoaded && !imageError && (
            <div className="w-full h-64 bg-slate-300 dark:bg-slate-700 animate-pulse" />
          )}
          {!imageError ? (
            <img 
              src={receiptData} 
              alt={`Receipt: ${description}`}
              className={`max-w-full h-auto object-contain transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          ) : (
            <div className="w-full h-64 bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="w-12 h-12 text-slate-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Failed to load image</p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
