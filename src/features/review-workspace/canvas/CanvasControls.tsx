/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, EyeOff, LayoutGrid, Layers, Tag } from 'lucide-react';
import { useCanvasStore, canvasActions } from '../state/canvasStore';

export default function CanvasControls() {
  const { showBoundingBoxes, showLabels, showMarkers } = useCanvasStore();

  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 shadow-2xl">
      <button
        onClick={() => canvasActions.toggleMarkers()}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
          showMarkers
            ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20'
            : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
        }`}
        title="Toggle issue hot markers"
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Markers</span>
      </button>

      <button
        onClick={() => canvasActions.toggleBoundingBoxes()}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
          showBoundingBoxes
            ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20'
            : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
        }`}
        title="Toggle highlighting box boundaries"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Bounding Boxes</span>
      </button>

      <button
        onClick={() => canvasActions.toggleLabels()}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
          showLabels
            ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20'
            : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
        }`}
        title="Toggle marker priority index tags"
      >
        <Tag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Labels</span>
      </button>
    </div>
  );
}
