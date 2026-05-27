import { useState } from 'react';
import { cn } from '../lib/utils';

export function UserAvatar({ 
  uid, 
  displayName, 
  photoURL, 
  className = "w-8 h-8" 
}: { 
  uid?: string; 
  displayName?: string | null; 
  photoURL?: string | null; 
  className?: string; 
}) {
  const [imgError, setImgError] = useState(false);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName || "User"}
        className={cn("rounded-full object-cover shrink-0 select-none", className)}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  // Consistent premium gradients based on string hash
  const gradients = [
    'from-orange-500 to-amber-500 text-white',
    'from-blue-500 to-indigo-500 text-white',
    'from-emerald-500 to-teal-500 text-white',
    'from-purple-500 to-pink-500 text-white',
    'from-rose-500 to-red-500 text-white',
    'from-cyan-500 to-sky-500 text-white',
  ];
  
  const seed = uid || displayName || "EX";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % gradients.length;
  const colorClass = gradients[colorIndex];

  // Derive elegant initials
  let initials = "EX";
  if (displayName) {
    const parts = displayName.trim().toUpperCase().split(/\s+/);
    if (parts.length >= 2) {
      initials = parts[0][0] + parts[1][0];
    } else if (parts[0] && parts[0][0]) {
      initials = parts[0][0] + (parts[0][1] || '');
    }
  } else if (uid) {
    initials = uid.substring(0, 2).toUpperCase();
  }

  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold uppercase select-none tracking-wider text-[10px] shrink-0 bg-gradient-to-br shadow-inner border border-white/10 dark:border-slate-800/20", colorClass, className)}>
      <span>{initials}</span>
    </div>
  );
}
