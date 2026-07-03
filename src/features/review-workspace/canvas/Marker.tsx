/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { selectionActions, useSelectionStore } from '../state/selectionStore';
import { zoomActions, useZoomStore } from '../state/zoomStore';
import { getIssueStatus } from '../state/issueStore';

interface MarkerProps {
  issue: CritiqIssue;
  index: number;
}

export default function Marker({ issue, index }: MarkerProps) {
  const { selectedIssueId, hoveredIssueId } = useSelectionStore();
  const { scale } = useZoomStore();
  const isSelected = selectedIssueId === issue.id;
  const isHovered = hoveredIssueId === issue.id;
  const status = getIssueStatus(issue.id);

  // Style helper based on severity
  const getSeverityStyles = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === 'critical') {
      return {
        bg: 'bg-rose-500',
        border: 'border-rose-400',
        ring: 'ring-rose-500/30',
        text: 'text-white',
        pulse: 'bg-rose-500/40',
      };
    }
    if (s === 'high') {
      return {
        bg: 'bg-orange-500',
        border: 'border-orange-400',
        ring: 'ring-orange-500/30',
        text: 'text-white',
        pulse: 'bg-orange-500/40',
      };
    }
    if (s === 'medium') {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-400',
        ring: 'ring-amber-500/30',
        text: 'text-black',
        pulse: 'bg-amber-500/40',
      };
    }
    return {
      bg: 'bg-sky-500',
      border: 'border-sky-400',
      ring: 'ring-sky-500/30',
      text: 'text-white',
      pulse: 'bg-sky-500/40',
    };
  };

  const colors = getSeverityStyles(issue.severity);

  // Counter-scale so markers don't get ridiculously huge or small when zooming
  const inverseScale = 1 / scale;
  // Let's cap the counter scaling so they don't look weirdly distorted
  const scaleFactor = Math.min(1.8, Math.max(0.4, inverseScale));

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectionActions.selectIssue(isSelected ? null : issue.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Zoom to 1.5x centered on this issue
    zoomActions.setScale(1.5);
  };

  return (
    <div
      style={{
        left: `${issue.boundingBox.x}%`,
        top: `${issue.boundingBox.y}%`,
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
      className="absolute z-20 cursor-pointer select-none"
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => selectionActions.hoverIssue(issue.id)}
      onMouseLeave={() => selectionActions.hoverIssue(null)}
    >
      <div className={`relative w-9 h-9 flex items-center justify-center transition-all ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      }`}>
        {/* Animated outer ring */}
        <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${colors.pulse}`} />

        {/* Outer glowing border */}
        <div className={`absolute inset-0.5 rounded-full ring-4 transition-all ${colors.ring} ${
          isSelected ? 'ring-indigo-500/60' : 'group-hover:ring-offset-1'
        }`} />

        {/* Central badge */}
        <div className={`w-6 h-6 rounded-full border border-white flex items-center justify-center z-10 font-mono text-[10px] font-bold shadow-lg transition-all ${
          isSelected 
            ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-indigo-500/50' 
            : `${colors.bg} ${colors.text}`
        } ${status === 'resolved' ? 'opacity-40 border-slate-600 line-through' : ''}`}>
          {index}
        </div>

        {/* Tiny visual resolver badge */}
        {status === 'resolved' && (
          <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-white z-20 text-[8px]">
            ✓
          </div>
        )}

        {/* Floating tooltip block */}
        {(isHovered || isSelected) && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-10 z-50 bg-[#0e0f14]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-2xl w-52 pointer-events-none">
            <div className="flex justify-between items-center gap-1.5 border-b border-white/5 pb-1 mb-1">
              <span className={`text-[8px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                {issue.severity}
              </span>
              <span className="text-[8px] text-slate-500 font-mono">
                Confidence: {issue.confidence}%
              </span>
            </div>
            <p className="text-[10px] font-semibold text-white leading-snug truncate">
              {issue.title}
            </p>
            <p className="text-[9px] text-slate-400 leading-normal line-clamp-2 mt-0.5 font-normal">
              {issue.description}
            </p>
            {status !== 'unresolved' && (
              <div className="text-[8px] mt-1 text-indigo-400 font-mono uppercase font-bold tracking-wide">
                Status: {status.replace('_', ' ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
