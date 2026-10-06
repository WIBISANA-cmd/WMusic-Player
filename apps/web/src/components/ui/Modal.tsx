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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={cn(
          'w-full max-w-md rounded-3xl bg-[#111726] border border-white/10 p-6 shadow-2xl space-y-4',
          className
        )}
      >
        <div className="flex items-center justify-between">
          {title && <h3 className="text-base font-bold text-white">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 ml-auto"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

