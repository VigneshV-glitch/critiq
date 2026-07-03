/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MarkerClusterItem } from '../services/markerService';
import { zoomActions, useZoomStore } from '../state/zoomStore';
import { selectionActions } from '../state/selectionStore';

interface MarkerClusterProps {
  cluster: MarkerClusterItem;
}

export default function MarkerCluster({ cluster }: MarkerClusterProps) {
  const { scale } = useZoomStore();
  const count = cluster.issues.length;

  // Find the highest severity in the cluster to color the cluster badge
  const getClusterSeverity = () => {
    const severities = cluster.issues.map(i => i.severity.toLowerCase());
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  };

  const highestSeverity = getClusterSeverity();

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-rose-600 border-rose-400 text-white shadow-rose-600/30';
      case 'high': return 'bg-orange-500 border-orange-400 text-white shadow-orange-500/30';
      case 'medium': return 'bg-amber-500 border-amber-400 text-black shadow-amber-500/30';
      default: return 'bg-sky-500 border-sky-400 text-white shadow-sky-500/30';
    }
  };

  const colorClass = getSeverityColor(highestSeverity);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Zoom in on cluster center to disperse it
    zoomActions.setScale(scale * 1.5);
    // Select the first issue inside
    if (cluster.issues.length > 0) {
      selectionActions.selectIssue(cluster.issues[0].id);
    }
  };

  // Keep marker scale consistent during zooming
  const inverseScale = 1 / scale;
  const scaleFactor = Math.min(1.8, Math.max(0.4, inverseScale));

  return (
    <div
      style={{
        left: `${cluster.centerPercent.x}%`,
        top: `${cluster.centerPercent.y}%`,
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
      className="absolute z-20 cursor-pointer select-none"
      onClick={handleClick}
    >
      <div className="relative w-11 h-11 flex items-center justify-center group hover:scale-105 transition-transform">
        {/* Layer 1: Bottom stacked circle */}
        <div className="absolute w-9 h-9 rounded-full bg-slate-800 border border-slate-600 opacity-60 translate-x-1.5 -translate-y-1" />
        
        {/* Layer 2: Middle stacked circle */}
        <div className="absolute w-9 h-9 rounded-full bg-slate-700 border border-slate-500 opacity-80 translate-x-0.5 -translate-y-0.5" />

        {/* Layer 3: Dynamic Glow Ring */}
        <div className="absolute inset-1 rounded-full bg-indigo-500/10 animate-pulse border border-indigo-400/20" />

        {/* Primary foreground circle */}
        <div className={`relative w-8.5 h-8.5 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl z-10 font-mono ${colorClass}`}>
          <span className="text-[11px] font-black leading-none">{count}</span>
          <span className="text-[7px] font-bold tracking-tight uppercase leading-none mt-0.5">issues</span>
        </div>

        {/* Hover Hover-Card */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-12 scale-0 group-hover:scale-100 transition-transform z-30 bg-[#0c0d12]/95 backdrop-blur-md p-2.5 rounded-xl border border-white/10 w-48 shadow-2xl pointer-events-none">
          <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide border-b border-white/5 pb-1 mb-1.5">
            Clustered Location
          </p>
          <div className="space-y-1">
            {cluster.issues.slice(0, 3).map((iss, index) => (
              <div key={iss.id} className="text-[10px] text-white font-medium truncate flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                {iss.title}
              </div>
            ))}
            {count > 3 && (
              <p className="text-[8px] text-indigo-400 font-mono mt-1 font-bold">
                + {count - 3} more issue(s). Click to expand.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
