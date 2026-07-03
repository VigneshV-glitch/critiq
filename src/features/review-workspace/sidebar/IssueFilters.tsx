/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, Sliders, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';
import { useFilterStore, filterActions } from '../state/filterStore';

export default function IssueFilters() {
  const { severities, categories, resolvedStatus, tags, confidenceThreshold } = useFilterStore();

  const handleReset = () => {
    filterActions.resetFilters();
  };

  return (
    <div className="space-y-5 bg-black/10 p-4 rounded-2xl border border-white/5">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs font-mono font-black text-white uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Review Filters</span>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] font-mono text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 font-bold"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET</span>
        </button>
      </div>

      {/* Resolution Status */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Resolution State
        </label>
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {(['all', 'unresolved', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => filterActions.setResolvedStatus(status)}
              className={`py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
                resolvedStatus === status
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Filter */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Severity
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
            const isActive = severities[severity];
            const getColors = () => {
              switch (severity) {
                case 'critical': return isActive ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'text-slate-500 border-transparent hover:bg-white/5';
                case 'high': return isActive ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'text-slate-500 border-transparent hover:bg-white/5';
                case 'medium': return isActive ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'text-slate-500 border-transparent hover:bg-white/5';
                default: return isActive ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'text-slate-500 border-transparent hover:bg-white/5';
              }
            };

            return (
              <button
                key={severity}
                onClick={() => filterActions.toggleSeverity(severity)}
                className={`py-1.5 px-2 text-[10px] font-mono font-bold uppercase rounded-xl border text-left flex items-center justify-between transition-all ${getColors()}`}
              >
                <span>{severity}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  severity === 'critical' ? 'bg-rose-500' : severity === 'high' ? 'bg-orange-500' : severity === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                } ${!isActive ? 'opacity-20' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          UX Dimension
        </label>
        <div className="space-y-1">
          {Object.entries(categories).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return (
              <label
                key={key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 cursor-pointer transition-all text-[11px] text-slate-300 font-medium select-none"
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => filterActions.toggleCategory(key)}
                  className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500/50 bg-black/50"
                />
                <span className="capitalize">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Confidence Score Threshold */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          <span>Min Confidence</span>
          <span className="text-indigo-400">{confidenceThreshold}%</span>
        </div>
        <div className="px-1 py-1">
          <input
            type="range"
            min="0"
            max="100"
            value={confidenceThreshold}
            onChange={(e) => filterActions.setConfidenceThreshold(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-white/10 rounded-lg outline-none"
          />
        </div>
      </div>

      {/* Additional Tag Filters */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Audit Tags
        </label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(tags) as Array<keyof typeof tags>).map((tagKey) => {
            const isActive = tags[tagKey];
            return (
              <button
                key={tagKey}
                onClick={() => filterActions.toggleTag(tagKey)}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono font-black uppercase border transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                    : 'bg-transparent text-slate-500 border-white/5 hover:text-slate-300'
                }`}
              >
                #{tagKey}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
