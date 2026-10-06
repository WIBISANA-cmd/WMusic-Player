'use client';

import React, { useState } from 'react';
import { Track } from '@music/shared';
import { usePlayerStore } from '@/stores/player-store';
import { Modal } from '@/components/ui/Modal';
import { PlayerArtwork } from './PlayerArtwork';
import { Play, ListPlus, Heart, Share2, Check, Radio } from 'lucide-react';

interface TrackActionModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  allTracks?: Track[];
}

export function TrackActionModal({
  track,
  isOpen,
  onClose,
  allTracks = []
}: TrackActionModalProps) {
  const { playTrack, addToQueue, addToQueueNext, toggleLike, likedTrackIds } = usePlayerStore();
  const [copied, setCopied] = useState(false);

  if (!track) return null;

  const isLiked = likedTrackIds.includes(track.id);

  const handlePlayNow = () => {
    playTrack(track, allTracks.length > 0 ? allTracks : [track]);
    onClose();
  };

  const handlePlayNext = () => {
    addToQueueNext(track);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    onClose();
  };

  const handleLike = () => {
    toggleLike(track);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?track=${track.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Track Actions">
      <div className="space-y-4">
        {/* Track Info Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl glass-card bg-slate-100/60">
          <PlayerArtwork track={track} isPlaying={false} size="sm" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-text-primary truncate">{track.title}</h4>
            <p className="text-xs text-text-secondary truncate">
              {track.artist} {track.genre ? `• ${track.genre}` : ''}
            </p>
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={handlePlayNow}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass-pill hover:bg-white text-sm font-semibold text-text-primary transition-all active:scale-98"
          >
            <Play size={18} className="text-slate-700" />
            <span>Play Now</span>
          </button>

          <button
            onClick={handlePlayNext}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass-pill hover:bg-white text-sm font-semibold text-text-primary transition-all active:scale-98"
          >
            <Radio size={18} className="text-slate-600" />
            <span>Play Next</span>
          </button>

          <button
            onClick={handleAddToQueue}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass-pill hover:bg-white text-sm font-semibold text-text-primary transition-all active:scale-98"
          >
            <ListPlus size={18} className="text-slate-600" />
            <span>Add to Queue</span>
          </button>

          <button
            onClick={handleLike}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-pill hover:bg-white text-sm font-semibold text-text-primary transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Heart
                size={18}
                fill={isLiked ? '#e11d48' : 'none'}
                className={isLiked ? 'text-rose-600' : 'text-slate-600'}
              />
              <span>{isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}</span>
            </div>
            {isLiked && <span className="text-xs text-rose-600 font-medium">Saved</span>}
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-pill hover:bg-white text-sm font-semibold text-text-primary transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} className="text-slate-600" />}
              <span>{copied ? 'Link Copied to Clipboard!' : 'Share Track'}</span>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
}
