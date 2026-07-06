/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useZoomStore, zoomActions } from '../state/zoomStore';

interface ZoomControlsProps {
  onFitScreen: () => void;
}

export default function ZoomControls({ onFitScreen }: ZoomControlsProps) {
  const { scale } = useZoomStore();
  const percentage = Math.round(scale * 100);

  return (
    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 shadow-2xl">
      <button
        onClick={() => zoomActions.zoomOut()}
        className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      
      <button
        onClick={() => zoomActions.resetZoom()}
        className="px-2.5 py-1.5 hover:bg-white/10 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors min-w-[52px] text-center"
        title="Reset zoom to 100%"
        aria-label="Reset Zoom"
      >
        {percentage}%
      </button>

      <button
        onClick={() => zoomActions.zoomIn()}
        className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1.5" />

      <button
        onClick={onFitScreen}
        className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
        title="Fit to screen"
        aria-label="Fit to Screen"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="text-xs font-bold font-mono hidden sm:inline">FIT</span>
      </button>
    </div>
  );
}
