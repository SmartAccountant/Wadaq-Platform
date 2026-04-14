import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, size = 'default', text }) {
  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin text-purple-500', sizes[size], className)} />
      {text && <p className="text-sm text-slate-400 animate-pulse">{text}</p>}
    </div>
  );
}

export function LoadingOverlay({ text }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
}

export function LoadingCard({ text, className }) {
  return (
    <div className={cn('bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8', className)}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}