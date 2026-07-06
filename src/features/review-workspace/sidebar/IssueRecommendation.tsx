/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { Lightbulb, BadgeAlert, Sparkles, AlertCircle } from 'lucide-react';

interface IssueRecommendationProps {
  issue: CritiqIssue;
}

export default function IssueRecommendation({ issue }: IssueRecommendationProps) {
  // Extract or fall back on standard recommendations
  const solutionText = (issue as any).recommendation || issue.recommendedSolution || 'Establish higher contrast, add aria-labels, or standardize padding sizes using the global design system.';
  const uxPrinciple = (issue as any).uxPrinciple || 'Aesthetic & Minimalist Design (Heuristic #8)';
  const wcagRule = (issue as any).accessibilityGuideline || 'WCAG 2.1 AA - 1.4.3 Contrast (Minimum)';
  const severityStr = (issue.severity || '').toString().toLowerCase();
  const estimatedImpact = (issue as any).estimatedImpact || (severityStr === 'critical' || severityStr === 'high' ? 'High' : 'Medium');
  const fixDifficulty = (issue as any).fixDifficulty || (severityStr === 'critical' ? 'Medium' : 'Easy');

  return (
    <div className="space-y-5">
      {/* Actionable Solution */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 pb-1 border-b border-white/5">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Actionable Solution
          </span>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl space-y-1.5">
          <span className="text-xs font-semibold text-white block">
            {(issue as any).bestPractice || 'Standardize visual component rules'}
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {solutionText}
          </p>
        </div>
      </div>

      {/* UX Rules & Guidelines */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
            UX HEURISTIC
          </span>
          <span className="text-xs text-indigo-300 font-mono block leading-snug">
            {uxPrinciple}
          </span>
        </div>

        <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
            ACCESSIBILITY (WCAG)
          </span>
          <span className="text-xs text-sky-300 font-mono block leading-snug">
            {wcagRule}
          </span>
        </div>
      </div>

      {/* Impact & Fix Effort Metrology */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
              ESTIMATED IMPACT
            </span>
            <span className="text-xs font-bold text-white block">
              {estimatedImpact}
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
              FIX DIFFICULTY
            </span>
            <span className="text-xs font-bold text-white block">
              {fixDifficulty}
            </span>
          </div>
          <AlertCircle className="w-4 h-4 text-indigo-400 opacity-60" />
        </div>
      </div>
    </div>
  );
}
