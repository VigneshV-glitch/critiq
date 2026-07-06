/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { Info, HelpCircle, ShieldAlert } from 'lucide-react';

interface IssueEvidenceProps {
  issue: CritiqIssue;
}

export default function IssueEvidence({ issue }: IssueEvidenceProps) {
  // Use fields from CritiqIssue or construct fallback values
  const evidenceList = issue.evidence || [issue.description];
  
  // Cast or find extended details
  const rootCause = (issue as any).rootCause || 'Visual styling misalignment or accessibility contrast violation in HTML tree.';
  const whyItMatters = (issue as any).whyItMatters || 'Failing WCAG standards or general UX heuristics reduces task completion efficiency and increases user friction.';

  return (
    <div className="space-y-4.5">
      {/* Evidence Bullet Points */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 pb-1 border-b border-white/5">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Detected Evidence
          </span>
        </div>
        <ul className="space-y-2">
          {evidenceList.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed font-normal">
              <span className="text-indigo-400 font-mono font-bold mt-0.5 select-none text-xs">[E{idx + 1}]</span>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Root Cause Analysis */}
      <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
          <Info className="w-3 h-3 text-indigo-400" />
          <span>Root Cause</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {rootCause}
        </p>
      </div>

      {/* Why It Matters */}
      <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Why It Matters</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {whyItMatters}
        </p>
      </div>
    </div>
  );
}
