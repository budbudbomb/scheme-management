'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VideoCamera, X } from '@phosphor-icons/react';

interface VideoPlayerModalProps {
  video: { url: string; title: string } | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll on body and main container when modal is open
  useEffect(() => {
    if (!video) return;

    const origBodyOverflow = document.body.style.overflow;
    const origBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Lock AppShell main scrollable container
    const mainEl = document.querySelector('main');
    const origMainOverflow = mainEl ? mainEl.style.overflow : '';
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.body.style.touchAction = origBodyTouchAction;
      if (mainEl) {
        mainEl.style.overflow = origMainOverflow;
      }
    };
  }, [video]);

  if (!video || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overscroll-none touch-none select-none"
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 touch-auto select-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <VideoCamera size={18} className="text-indigo-600 shrink-0" />
            <span className="text-sm font-bold text-slate-800 truncate">{video.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Video Player */}
        <div className="p-4 bg-black flex items-center justify-center">
          <video
            src={video.url}
            controls
            autoPlay
            playsInline
            className="max-h-[60vh] w-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
