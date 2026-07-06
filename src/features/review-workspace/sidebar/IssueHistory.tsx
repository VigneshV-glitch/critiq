/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useIssueStore } from '../state/issueStore';
import { Clock, User, CheckCircle2 } from 'lucide-react';

interface IssueHistoryProps {
  issueId: string;
}

export default function IssueHistory({ issueId }: IssueHistoryProps) {
  const { historyMap } = useIssueStore();
  const history = historyMap[issueId] || [];

  if (history.length === 0) {
    return (
      <div className="py-4 text-center rounded-xl bg-black/25 border border-white/5">
        <span className="text-xs font-mono text-slate-400 block uppercase">No activity history logs</span>
        <span className="text-xs text-slate-500 font-normal leading-normal mt-0.5 block px-3">
          Status changes and logs will appear here.
        </span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-emerald-400 bg-emerald-500/10';
      case 'ignored': return 'text-slate-400 bg-slate-500/10';
      case 'needs_review': return 'text-amber-400 bg-amber-500/10';
      case 'accepted': return 'text-indigo-400 bg-indigo-500/10';
      case 'rejected': return 'text-rose-400 bg-rose-500/10';
      default: return 'text-sky-400 bg-sky-500/10';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 pb-1 border-b border-white/5">
        <Clock className="w-3 h-3 text-slate-500" />
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Activity Trail Logs
        </span>
      </div>
      <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {history.map((entry, idx) => (
          <div key={idx} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex justify-between items-start gap-2">
              <span className={`px-1.5 py-0.5 text-[10px] font-mono font-black uppercase rounded ${getStatusColor(entry.status)}`}>
                {entry.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-xs text-slate-300 font-normal leading-normal">
              {entry.note}
            </p>

            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 pt-1">
              <User className="w-2.5 h-2.5 text-slate-500" />
              <span>By {entry.user}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
