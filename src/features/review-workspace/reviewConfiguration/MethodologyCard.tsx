/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  Compass,
  Layout,
  Smartphone,
  Sliders,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { ReviewMethodology } from './types';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Eye,
  Compass,
  Layout,
  Smartphone,
  Sliders,
};

interface MethodologyCardProps {
  key?: string;
  methodology: ReviewMethodology;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MethodologyCard({ methodology, isSelected, onSelect }: MethodologyCardProps) {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const IconComponent = ICON_MAP[methodology.icon] || Sparkles;

  const isRecommended = methodology.id === 'comprehensive-critiq';

  // Format visual weight distribution badges
  const weights = Object.entries(methodology.weightProfile)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);

  // Included / Not Included static mappings
  const getInclusions = (id: string) => {
    switch (id) {
      case 'wcag-accessibility':
        return {
          included: ['Contrast ratios', 'Screen readers', 'Tap target spacing', 'Keyboard accessibility'],
          excluded: ['Widescreen dashboards', 'High density table optimizations', 'Custom aesthetic styles']
        };
      case 'nielsen-usability':
        return {
          included: ['User control / freedom', 'Consistency & standards', 'Error prevention', 'Recognition vs recall'],
          excluded: ['Strict 8px grid spacing', 'A11y ARIA token check', 'Responsive breakpoints']
        };
      case 'enterprise-ux':
        return {
          included: ['Data density', 'Layout efficiency', 'Dashboard structures', 'Complex data views'],
          excluded: ['Mobile gesture safe-zones', 'Simplified onboarding flows', 'Brand aesthetics']
        };
      case 'mobile-ux':
        return {
          included: ['Ergonomic touch zones', 'Viewport boundaries', 'Gesture pathways', 'Responsive flow'],
          excluded: ['Dense desktop panels', 'Multi-panel layouts', 'Keyboard navigation flow']
        };
      case 'design-system':
        return {
          included: ['8px spacing grid', 'Typography scale validation', 'Visual token hierarchy', 'Component consistency'],
          excluded: ['Content readability checks', 'Cognitive load index', 'Interaction delay guidelines']
        };
      case 'comprehensive-critiq':
      default:
        return {
          included: ['Accessibility standards', 'Heuristic usability', 'Pixel grids & tokens', 'Small & large screen scaling'],
          excluded: ['Specialized medical compliance checks']
        };
    }
  };

  const { included, excluded } = getInclusions(methodology.id);

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailExpanded(!isDetailExpanded);
  };

  return (
    <div
      id={`methodology-card-${methodology.id}`}
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border transition-all duration-300 relative overflow-hidden group select-none flex flex-col justify-between cursor-pointer ${
        isSelected
          ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-xl shadow-indigo-950/30 ring-1 ring-indigo-500/20'
          : 'bg-[#0f1016]/80 border-white/5 text-slate-300 hover:bg-[#141520]/80 hover:border-white/10'
      }`}
    >
      {/* Background Accent Gradients */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
      )}

      <div className="p-5 flex flex-col h-full">
        {/* Top Header with Icon, Title, and Badges */}
        <div className="flex items-start justify-between gap-3.5 w-full">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl transition-colors duration-300 ${
                isSelected ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-400'
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  {methodology.name}
                </h4>
                {isRecommended && (
                  <span className="text-xs font-semibold bg-indigo-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    ⭐ Recommended
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-0.5 block">
                {methodology.analysisDepth} audit
              </span>
            </div>
          </div>

          {/* Selected Status Circle */}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
              isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700 bg-transparent text-transparent'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        {/* Short One-line Description */}
        <p className="text-sm text-slate-300 mt-3.5 leading-relaxed font-normal">
          {methodology.description}
        </p>

        {/* Simplified Metadata */}
        <div className="flex items-center justify-between gap-2 mt-5 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{methodology.estimatedDuration}</span>
          </div>

          {/* Toggle Details or Count Indicator */}
          <button
            onClick={toggleDetails}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
              isDetailExpanded
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <span className="text-xs">+{methodology.focusAreas.length} focus areas</span>
            {isDetailExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Progressive Disclosure: Advanced Details (Expanded) */}
        <AnimatePresence>
          {isDetailExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden mt-4 border-t border-white/5 pt-4 space-y-4"
              onClick={(e) => e.stopPropagation()} // Prevent card selection toggle when interacting with detail drawer
            >
              {/* Focus Areas list */}
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Target Focus Domains</span>
                <div className="flex flex-wrap gap-1.5">
                  {methodology.focusAreas.map((area) => (
                    <span key={area} className="text-xs bg-white/5 text-slate-300 px-2 py-0.5 rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weight Distribution Bars */}
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Weight Profile Distribution</span>
                <div className="space-y-2">
                  {weights.map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span className="capitalize">{key === 'ux' ? 'Usability (UX)' : (key === 'ui' ? 'Design System' : key)}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="w-full bg-slate-800/60 rounded-full h-1">
                        <div
                          className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1.5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest block">Included In Audit</span>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {included.map((inc) => (
                      <li key={inc} className="truncate text-xs">{inc}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Not Evaluated</span>
                  <ul className="space-y-1 text-slate-500 list-disc list-inside">
                    {excluded.map((exc) => (
                      <li key={exc} className="truncate text-xs">{exc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confidence factor */}
              <div className="bg-white/2 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Analysis Confidence Posture</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                  {methodology.analysisDepth === 'comprehensive' ? 'Highest Confidence (95%+)' : 'High Confidence'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
