/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useSelectionStore, selectionActions } from '../state/selectionStore';
import { useFilterStore } from '../state/filterStore';
import { useIssueStore } from '../state/issueStore';
import IssueDetails from './IssueDetails';
import { 
  Layers, 
  HelpCircle, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  EyeOff, 
  Compass, 
  Flame,
  LayoutTemplate
} from 'lucide-react';

interface IssueSidebarProps {
  issues: CritiqIssue[];
}

export default function IssueSidebar({ issues }: IssueSidebarProps) {
  const { selectedIssueId, hoveredIssueId } = useSelectionStore();
  const { searchQuery, severities, categories, resolvedStatus, tags, confidenceThreshold } = useFilterStore();
  const { statusMap } = useIssueStore();

  const selectedIssue = useMemo(() => {
    return issues.find((i) => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Apply filtering logic identical to IssueMarkers
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = 
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          (issue.category && issue.category.toLowerCase().includes(query));
        
        if (!matchesText) return false;
      }

      const sev = issue.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      if (severities[sev] === false) return false;

      const catKey = issue.category ? issue.category.toLowerCase() : '';
      let mappedCatKey = 'visualDesign';
      if (catKey.includes('usability')) mappedCatKey = 'usability';
      else if (catKey.includes('accessibility')) mappedCatKey = 'accessibility';
      else if (catKey.includes('consistency')) mappedCatKey = 'consistency';

      if (categories[mappedCatKey] === false) return false;

      const currentStatus = statusMap[issue.id] || 'unresolved';
      if (resolvedStatus === 'resolved' && currentStatus !== 'resolved') return false;
      if (resolvedStatus === 'unresolved' && currentStatus === 'resolved') return false;

      if (issue.confidence < confidenceThreshold) return false;

      const isAccessibilityRelated = 
        issue.category?.toLowerCase().includes('accessibility') ||
        issue.title.toLowerCase().includes('contrast') || 
        issue.description.toLowerCase().includes('contrast');
      
      const isDesignSystemRelated =
        issue.category?.toLowerCase().includes('consistency') ||
        issue.description.toLowerCase().includes('system') ||
        issue.description.toLowerCase().includes('spacing');

      if (!tags.accessibility && isAccessibilityRelated) return false;
      if (!tags.designSystem && isDesignSystemRelated) return false;

      return true;
    });
  }, [issues, searchQuery, severities, categories, resolvedStatus, tags, confidenceThreshold, statusMap]);

  // Statistics calculation for overview
  const stats = useMemo(() => {
    const total = issues.length;
    let resolvedCount = 0;
    let criticalCount = 0;
    let highCount = 0;

    issues.forEach(i => {
      const s = statusMap[i.id] || 'unresolved';
      if (s === 'resolved') resolvedCount++;
      if (i.severity.toLowerCase() === 'critical') criticalCount++;
      if (i.severity.toLowerCase() === 'high') highCount++;
    });

    return { total, resolvedCount, criticalCount, highCount };
  }, [issues, statusMap]);

  const getSeverityPill = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'bg-rose-500/15 text-rose-400 border-rose-500/15';
      case 'high': return 'bg-orange-500/15 text-orange-400 border-orange-500/15';
      case 'medium': return 'bg-amber-500/15 text-amber-300 border-amber-500/15';
      default: return 'bg-sky-500/15 text-sky-400 border-sky-500/15';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'ignored': return <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      default: return <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {selectedIssue ? (
        // Detailed Interactive Action View for focused item
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-black/10 px-3.5 py-2.5 rounded-xl border border-white/5">
            <span className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>Inspecting Element</span>
            </span>
            <button
              onClick={() => selectionActions.selectIssue(null)}
              className="text-xs font-mono text-indigo-400 hover:text-white font-bold cursor-pointer"
            >
              ← OVERVIEW
            </button>
          </div>

          <IssueDetails issue={selectedIssue} filteredIssues={filteredIssues} />
        </div>
      ) : (
        // Comprehensive lists and high-level health metrics
        <div className="space-y-4 flex flex-col h-full min-h-0">
          
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 bg-black/25 rounded-2xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-wider uppercase">
                RESOLVED FINDINGS
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-mono font-black text-white">
                  {stats.resolvedCount}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {stats.total}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-black/25 rounded-2xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-wider uppercase">
                HEALTH GRADE
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-mono font-black text-rose-400">
                  {stats.criticalCount > 0 ? 'FAIL' : stats.highCount > 2 ? 'C+' : 'A'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {stats.criticalCount} Critical
                </span>
              </div>
            </div>
          </div>

          {/* List Title */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-mono font-black text-white uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Issues ({filteredIssues.length})</span>
            </div>
            {filteredIssues.length !== issues.length && (
              <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                Filtered
              </span>
            )}
          </div>

          {/* Scrollable list items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-0">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 space-y-2">
                <LayoutTemplate className="w-8 h-8 text-slate-700 mx-auto" />
                <div className="space-y-0.5">
                  <p className="text-xs font-mono font-bold text-slate-400 uppercase">No issues matched filters</p>
                  <p className="text-xs text-slate-400 font-normal leading-normal max-w-[200px] mx-auto">
                    Try loosening your search terms or expanding your filter rules in the left panel.
                  </p>
                </div>
              </div>
            ) : (
              filteredIssues.map((issue, idx) => {
                const isHovered = hoveredIssueId === issue.id;
                const index = issues.findIndex(i => i.id === issue.id) + 1;
                const status = statusMap[issue.id] || 'unresolved';

                return (
                  <div
                    key={issue.id}
                    id={`issue-card-${issue.id}`}
                    onClick={() => selectionActions.selectIssue(issue.id)}
                    onMouseEnter={() => selectionActions.hoverIssue(issue.id)}
                    onMouseLeave={() => selectionActions.hoverIssue(null)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex gap-3.5 select-none ${
                      isHovered
                        ? 'bg-indigo-600/5 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                        : 'bg-black/20 border-white/5 hover:bg-black/40 hover:border-white/10'
                    }`}
                  >
                    {/* Index Circle Indicator */}
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-black flex items-center justify-center text-slate-300 shrink-0">
                      {index}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs md:text-sm font-semibold text-white tracking-tight leading-normal truncate">
                          {issue.title}
                        </h4>
                        {getStatusIndicator(status)}
                      </div>

                      <p className="text-xs text-slate-300 font-normal leading-normal line-clamp-2">
                        {issue.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black uppercase rounded border ${getSeverityPill(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Conf: {issue.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export { selectionActions };
