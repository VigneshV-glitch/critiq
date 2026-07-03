/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useCanvasStore } from '../state/canvasStore';
import { useSelectionStore, selectionActions } from '../state/selectionStore';
import { getIssueStatus } from '../state/issueStore';

interface BoundingBoxesProps {
  issues: CritiqIssue[];
}

export default function BoundingBoxes({ issues }: BoundingBoxesProps) {
  const { showBoundingBoxes } = useCanvasStore();
  const { selectedIssueId, hoveredIssueId } = useSelectionStore();

  if (!showBoundingBoxes) return null;

  const getSeverityColors = (severity: string, isActive: boolean) => {
    const s = severity.toLowerCase();
    if (s === 'critical') {
      return isActive 
        ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.35)]' 
        : 'border-rose-500/30 bg-rose-500/2';
    }
    if (s === 'high') {
      return isActive 
        ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.35)]' 
        : 'border-orange-500/30 bg-orange-500/2';
    }
    if (s === 'medium') {
      return isActive 
        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.35)]' 
        : 'border-amber-500/30 bg-amber-500/2';
    }
    return isActive 
      ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.35)]' 
      : 'border-sky-500/30 bg-sky-500/2';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {issues.map((issue, idx) => {
        const isSelected = selectedIssueId === issue.id;
        const isHovered = hoveredIssueId === issue.id;
        const status = getIssueStatus(issue.id);
        const isActive = isSelected || isHovered;

        if (status === 'resolved' && !isSelected) return null; // Hide boxes for resolved issues unless selected

        const styleClass = getSeverityColors(issue.severity, isActive);
        const box = issue.boundingBox || { x: 10, y: 10, width: 20, height: 10 };

        return (
          <div
            key={issue.id}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            className={`absolute border rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${styleClass} ${
              isSelected ? 'ring-2 ring-indigo-500 animate-pulse' : 'hover:border-indigo-400'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              selectionActions.selectIssue(isSelected ? null : issue.id);
            }}
            onMouseEnter={() => selectionActions.hoverIssue(issue.id)}
            onMouseLeave={() => selectionActions.hoverIssue(null)}
          >
            {/* Visual identification badge on active box */}
            {isActive && (
              <div className="absolute -top-6 left-0 bg-indigo-600 border border-indigo-400 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 z-30">
                <span>#{idx + 1}</span>
                <span className="uppercase text-[8px] opacity-75">{issue.severity}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
