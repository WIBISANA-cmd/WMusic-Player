'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-3xl glass-card bg-white/85 border border-white/80 p-6 shadow-glass-lg space-y-4 text-text-primary',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        <div className="flex items-center justify-between">
          {title && <h3 className="text-base font-bold text-text-primary">{title}</h3>}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-11 h-11 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-200/50 transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
