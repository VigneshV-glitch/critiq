/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useIssueStore, issueActions } from '../state/issueStore';
import { useSelectionStore, selectionActions } from '../state/selectionStore';
import IssueEvidence from './IssueEvidence';
import IssueRecommendation from './IssueRecommendation';
import IssueHistory from './IssueHistory';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  EyeOff, 
  FolderLock, 
  Clock, 
  Settings,
  XSquare
} from 'lucide-react';
import { IssueStatus } from '../state/types';

interface IssueDetailsProps {
  issue: CritiqIssue;
  filteredIssues: CritiqIssue[];
}

export default function IssueDetails({ issue, filteredIssues }: IssueDetailsProps) {
  const { statusMap } = useIssueStore();
  const currentStatus = statusMap[issue.id] || 'unresolved';
  
  const [activeTab, setActiveTab] = useState<'evidence' | 'solution' | 'history'>('evidence');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Index mapping inside filtered issues list
  const currentIndex = filteredIssues.findIndex(i => i.id === issue.id);
  const totalCount = filteredIssues.length;

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      selectionActions.selectIssue(filteredIssues[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      selectionActions.selectIssue(filteredIssues[currentIndex - 1].id);
    }
  };

  const handleStatusChange = (status: IssueStatus) => {
    let note = `Status changed to ${status.replace('_', ' ')}`;
    if (status === 'resolved') note = 'Audit finding solved. Visual design verified.';
    else if (status === 'ignored') note = 'Issue marked as ignored. Intentional design choice.';
    else if (status === 'needs_review') note = 'Sent back to UX design review board.';

    issueActions.updateIssueStatus(issue.id, status, note);
    setShowStatusDropdown(false);
  };

  // Severity style helper
  const getSeverityBadge = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === 'critical') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (s === 'high') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (s === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  };

  const statusOptions: { value: IssueStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'unresolved', label: 'Unresolved', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    { value: 'resolved', label: 'Resolved', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> },
    { value: 'ignored', label: 'Ignore Issue', icon: <EyeOff className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'needs_review', label: 'Needs Review', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { value: 'accepted', label: 'Accept Finding', icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> },
    { value: 'rejected', label: 'Reject / Invalid', icon: <XSquare className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  const currentStatusObj = statusOptions.find(o => o.value === currentStatus) || statusOptions[0];

  return (
    <div className="space-y-5 bg-black/20 p-5 rounded-2xl border border-white/5 relative">
      {/* Index Navigation & Dismiss header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Audit Item {currentIndex + 1} of {totalCount}
        </span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            title="Previous Issue"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === totalCount - 1}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            title="Next Issue"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Metadata badges */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
          {issue.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`px-2 py-0.5 text-xs font-mono font-black uppercase rounded-lg border ${getSeverityBadge(issue.severity)}`}>
            {issue.severity}
          </span>
          <span className="bg-black/30 border border-white/5 text-slate-300 text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
            Conf: {issue.confidence}%
          </span>
          {issue.category && (
            <span className="bg-indigo-950/20 border border-indigo-500/15 text-indigo-300 text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
              {issue.category}
            </span>
          )}
        </div>
      </div>

      {/* Resolution status manager */}
      <div className="relative">
        <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Resolution Workflow
        </label>
        
        <button
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-black/40 border border-white/5 rounded-xl text-xs text-white hover:border-white/15 hover:bg-black/60 transition-all font-medium"
        >
          <div className="flex items-center gap-2">
            {currentStatusObj.icon}
            <span>{currentStatusObj.label}</span>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {showStatusDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs text-left transition-colors ${
                  currentStatus === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.icon}
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Tabs */}
      <div className="space-y-3.5">
        <div className="flex border-b border-white/5 p-1 bg-black/40 rounded-xl">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === 'evidence'
                ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Evidence
          </button>
          <button
            onClick={() => setActiveTab('solution')}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === 'solution'
                ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solution
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Logs
          </button>
        </div>

        {/* Tab content area */}
        <div className="min-h-[160px]">
          {activeTab === 'evidence' && <IssueEvidence issue={issue} />}
          {activeTab === 'solution' && <IssueRecommendation issue={issue} />}
          {activeTab === 'history' && <IssueHistory issueId={issue.id} />}
        </div>
      </div>
    </div>
  );
}
