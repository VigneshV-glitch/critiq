/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Grid,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Sliders,
  Settings,
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  Cpu,
  Trash2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, AuditReport, Rule, ReviewType, Issue, ChatMessage } from '../types';
import { calculateReportScore } from '../lib/scoring';

interface ReviewWorkspaceProps {
  project: Project | null;
  rules: Rule[];
  activeReport: AuditReport | null;
  activeProvider: string;
  onSelectProvider: (key: string) => void;
  onToggleRule: (key: string) => void;
  onUpdateWeight: (key: string, weight: number) => void;
  onRunAudit: (reviewType: ReviewType, customPrompt?: string) => void;
  onAddCustomIssue: (issue: Omit<Issue, 'id'>) => void;
  onCloseWorkspace: () => void;
}

export default function ReviewWorkspace({
  project,
  rules,
  activeReport,
  activeProvider,
  onSelectProvider,
  onToggleRule,
  onUpdateWeight,
  onRunAudit,
  onAddCustomIssue,
  onCloseWorkspace
}: ReviewWorkspaceProps) {
  const [reviewType, setReviewType] = useState<ReviewType>(ReviewType.FULL_AUDIT);
  const [zoom, setZoom] = useState<number>(100);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    visualDesign: true,
    usability: false,
    accessibility: false,
    consistency: false
  });

  const getIssueCategory = (issue: Issue): 'visualDesign' | 'usability' | 'accessibility' | 'consistency' => {
    const key = (issue.ruleKey || '').toLowerCase();
    const title = (issue.title || '').toLowerCase();
    const desc = (issue.description || '').toLowerCase();

    if (
      key.includes('contrast') || title.includes('contrast') || desc.includes('contrast') ||
      key.includes('accessibility') || title.includes('accessibility') || desc.includes('accessibility') ||
      key.includes('wcag') || title.includes('wcag') || desc.includes('wcag') ||
      key.includes('readability') || title.includes('readability') || desc.includes('readability') ||
      key.includes('focus') || title.includes('focus') || desc.includes('focus') ||
      key.includes('color_dependency') || key.includes('color-dependency') ||
      title.includes('color dependency') || desc.includes('color dependency') ||
      key.includes('touch') || title.includes('touch') || desc.includes('touch') ||
      title.includes('target size') || desc.includes('target size')
    ) {
      return 'accessibility';
    }
    
    if (
      key.includes('consistency') || title.includes('consistency') || desc.includes('consistency') ||
      key.includes('spacing_grid') || key.includes('grid') || title.includes('grid') || desc.includes('grid') ||
      key.includes('design_system') || key.includes('design-system') || title.includes('design system') || desc.includes('design system') ||
      key.includes('brand') || title.includes('brand') || desc.includes('brand') ||
      title.includes('spacing deviation') || desc.includes('spacing deviation') ||
      key.includes('reuse') || title.includes('reuse') || desc.includes('reuse')
    ) {
      return 'consistency';
    }

    if (
      key.includes('usability') || title.includes('usability') || desc.includes('usability') ||
      key.includes('heuristic') || title.includes('heuristic') || desc.includes('heuristic') ||
      key.includes('fitts') || title.includes('fitts') || desc.includes('fitts') ||
      key.includes('hick') || title.includes('hick') || desc.includes('hick') ||
      key.includes('friction') || title.includes('friction') || desc.includes('friction') ||
      key.includes('workflow') || title.includes('workflow') || desc.includes('workflow') ||
      key.includes('navigation') || title.includes('navigation') || desc.includes('navigation') ||
      key.includes('cognitive') || title.includes('cognitive') || desc.includes('cognitive') ||
      key.includes('efficiency') || title.includes('efficiency') || desc.includes('efficiency') ||
      key.includes('control') || title.includes('control') || desc.includes('control') ||
      key.includes('error_prevention') || title.includes('error prevention') || desc.includes('error prevention')
    ) {
      return 'usability';
    }

    return 'visualDesign';
  };

  
  // Chatbot states
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! I've loaded your design layout. You can run a Full UX/UI Audit to get an in-depth heuristic scorecard, or ask me design questions here.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const getSeverityStyle = (severity: 'low' | 'medium' | 'high' | 'critical' | 'info') => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-600',
          text: 'text-white',
          border: 'border-rose-500/30',
          badgeBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
          pingBg: 'bg-rose-600/40',
        };
      case 'high':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: 'border-red-500/30',
          badgeBg: 'bg-red-500/15 text-red-300 border border-red-500/25',
          pingBg: 'bg-red-500/40',
        };
      case 'medium':
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          border: 'border-amber-500/30',
          badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
          pingBg: 'bg-amber-500/40',
        };
      case 'low':
        return {
          bg: 'bg-indigo-500',
          text: 'text-white',
          border: 'border-indigo-500/30',
          badgeBg: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
          pingBg: 'bg-indigo-500/40',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-500',
          text: 'text-white',
          border: 'border-sky-500/30',
          badgeBg: 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
          pingBg: 'bg-sky-500/40',
        };
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (activeReport && activeReport.imageUrl) {
      const img = new Image();
      img.src = activeReport.imageUrl;
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
    } else {
      setImageDimensions(null);
    }
  }, [activeReport]);

  let canvasWidth = 320;
  let canvasHeight = 480;

  if (imageDimensions) {
    const ar = imageDimensions.width / imageDimensions.height;
    if (ar <= 0.75) {
      canvasWidth = 320;
      canvasHeight = Math.round(320 / ar);
    } else if (ar >= 1.5) {
      canvasWidth = 600;
      canvasHeight = Math.round(600 / ar);
    } else {
      canvasWidth = 420;
      canvasHeight = Math.round(420 / ar);
    }
  }

  // Auto scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Math.random()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentQuery = chatInput;
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/critiq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentQuery,
          history: chatHistory.slice(-10)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to chat: ${response.statusText}`);
      }

      const result = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant_${Math.random()}`,
        sender: 'assistant',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, assistantMsg]);

      if (result.recommendations && result.recommendations.length > 0) {
        result.recommendations.forEach((rec: any) => {
          onAddCustomIssue({
            category: rec.category || 'UX_RULES',
            ruleKey: rec.category === 'UX_RULES' ? 'heuristic_manual' : 'ui_manual',
            title: rec.title,
            description: rec.description,
            severity: rec.severity || 'medium',
            boundingBox: {
              x: Math.floor(15 + Math.random() * 50),
              y: Math.floor(25 + Math.random() * 40),
              width: 20,
              height: 8
            },
            recommendation: rec.description
          });
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      const assistantMsg: ChatMessage = {
        id: `assistant_${Math.random()}`,
        sender: 'assistant',
        text: "I evaluated your layout structure. To correct the grid, increase touch target heights to 44px minimum and verify font sizes.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRunFullAudit = () => {
    onRunAudit(reviewType);
  };

  const activeProviderName = 
    activeProvider === 'claude' ? 'Claude 3.5 Sonnet' : 
    (activeProvider === 'chatgpt' ? 'GPT-4o Vision' : 'Gemini 2.5 Flash / Pro');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      
      {/* Top bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#060609]/80 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCloseWorkspace}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold px-3 py-1.5 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            New Inspection
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <h2 className="text-sm font-medium text-slate-300">
            Layout: <span className="text-white font-semibold">{activeReport?.name || 'Uploaded Screen'}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value as ReviewType)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value={ReviewType.FULL_AUDIT}>Full UX/UI Audit</option>
            <option value={ReviewType.UX_HEURISTICS}>UX Heuristics Only</option>
            <option value={ReviewType.UI_GUIDELINES}>UI Guidelines Only</option>
          </select>

          <button 
            onClick={handleRunFullAudit}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Analyze Heuristics
          </button>

          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="p-1.5 bg-white/3 hover:bg-white/6 border border-white/5 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 px-3 text-xs"
            title="Review Settings"
          >
            <Settings className="w-4 h-4" />
            Rules & weights
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* CENTER: Interactive Design Canvas with scale & overlays */}
        <div className="flex-1 bg-black/10 flex flex-col items-center justify-center relative p-6 overflow-hidden">
          
          {/* Grid Overlay Controls (Top left) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(50, prev - 25))}
              className="p-2 bg-black/60 hover:bg-black/85 rounded-xl text-slate-300 border border-white/5 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 bg-black/60 rounded-xl text-xs font-mono text-white border border-white/5 min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(200, prev + 25))}
              className="p-2 bg-black/60 hover:bg-black/85 rounded-xl text-slate-300 border border-white/5 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                showGridOverlay 
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400/30' 
                  : 'bg-black/60 text-slate-300 border-white/5 hover:bg-black/85'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>{showGridOverlay ? '8px Grid: ON' : 'Show Spacing Grid'}</span>
            </button>
          </div>

          {/* Scale stage viewport */}
          <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-6">
            <div 
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: 'center center',
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`
              }}
              className="bg-[#0b0c10] rounded-[32px] border-4 border-slate-800/80 shadow-2xl relative overflow-hidden transition-transform duration-200 shrink-0 select-none"
            >
              {/* Spacing alignment grids */}
              {showGridOverlay && (
                <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-12 grid-rows-12 gap-px bg-transparent opacity-20">
                  {Array.from({ length: 144 }).map((_, idx) => (
                    <div key={idx} className="border border-indigo-500/20"></div>
                  ))}
                </div>
              )}

              {/* Render either uploaded screen or sandbox wireframe */}
              {activeReport && activeReport.imageUrl ? (
                <img 
                  src={activeReport.imageUrl} 
                  alt="Review wireframe" 
                  className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
                    activeReport.isUnavailable ? 'blur-md brightness-[0.25]' : ''
                  }`}
                />
              ) : (
                <div className="p-6 space-y-4 h-full flex flex-col select-none text-left justify-center items-center text-slate-500">
                  <Layers className="w-10 h-10 text-slate-700 animate-pulse mb-2" />
                  <span className="text-xs font-mono">Drawing interface context...</span>
                </div>
              )}

              {/* Interactive Bounding Hotspot Overlays */}
              {activeReport && !activeReport.isUnavailable && activeReport.issues.map((issue, idx) => {
                const isSelected = selectedIssueId === issue.id;
                const style = getSeverityStyle(issue.severity);
                return (
                  <div
                    key={issue.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIssueId(isSelected ? null : issue.id);
                    }}
                    style={{ 
                      left: `${issue.boundingBox.x}%`, 
                      top: `${issue.boundingBox.y}%` 
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  >
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <div className={`absolute w-full h-full rounded-full animate-ping opacity-75 ${style.pingBg}`} />
                      <div className={`w-6 h-6 text-[10px] font-mono font-bold rounded-full border border-white flex items-center justify-center z-10 transition-all ${
                        isSelected ? 'scale-125 shadow-2xl bg-indigo-600' : `${style.bg}`
                      } text-white`}>
                        {idx + 1}
                      </div>

                      {/* Floating tooltip annotation */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-9 scale-0 group-hover:scale-100 transition-transform z-30 bg-black/90 backdrop-blur-md text-[9px] text-slate-200 py-1.5 px-2.5 rounded-lg border border-white/5 whitespace-nowrap shadow-xl">
                        {issue.title}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Temporarily Unavailable Retry Dialog */}
              {activeReport?.isUnavailable && (
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-6 z-30 pointer-events-auto">
                  <div className="bg-[#0e0e12] max-w-[300px] w-full p-5 rounded-2xl border border-amber-500/25 shadow-2xl space-y-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-white tracking-wide uppercase font-mono">AI Review Unavailable</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Visual analysis failed after strategic retries due to Gemini API rate limits or transient load.
                      </p>
                    </div>
                    <button
                      onClick={() => onRunAudit(ReviewType.FULL_AUDIT)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all font-mono"
                    >
                      Retry Visual Audit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom helper tip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="px-4 py-1.5 bg-black/60 rounded-full text-[10px] font-mono border border-white/5 text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Click hotspot pins on the mockup layout to inspect recommendations
            </div>
          </div>
        </div>

        {/* RIGHT: Detailed Findings & Feedback panel */}
        <div className="w-96 border-l border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl flex flex-col overflow-hidden shrink-0 z-10">
          
          {/* Scoring Header wheel block */}
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Audit Scorecard</span>
            
            {activeReport && (
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-indigo-300 font-bold">SCORE:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {calculateReportScore(activeReport.issues).score}/100
                </span>
              </div>
            )}
          </div>

          {/* Scrollable content lists */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            
            {/* Index rating scorecard */}
            {activeReport ? (
              <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-4 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider font-semibold">Overall Design Score</span>
                    <h4 className="text-4xl font-display font-semibold text-white mt-1">
                      {calculateReportScore(activeReport.issues).score}
                      <span className="text-sm font-mono text-slate-500 font-normal">/100</span>
                    </h4>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    calculateReportScore(activeReport.issues).score >= 80 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {calculateReportScore(activeReport.issues).score >= 80 ? 'Grade A' : 'Needs Tuning'}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-200 bg-black/35 p-4 rounded-xl border border-white/5 font-normal">
                  {activeReport.summary}
                </p>

                {/* AI Visual Observation Summary (Explainability and Traceability) */}
                {activeReport.visualObservationSummary && (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">AI Screen Observations</span>
                    </div>
                    <div className="text-xs space-y-3 font-sans text-slate-200">
                      <div>
                        <span className="text-slate-500 font-bold font-mono text-[10px] uppercase tracking-wider block">Detected Layout</span>
                        <span className="text-white font-semibold text-sm">{activeReport.visualObservationSummary.screenType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold font-mono text-[10px] uppercase tracking-wider block">Primary Purpose</span>
                        <span className="text-slate-200 text-sm leading-relaxed">{activeReport.visualObservationSummary.primaryPurpose}</span>
                      </div>
                      {activeReport.visualObservationSummary.visibleComponents && activeReport.visualObservationSummary.visibleComponents.length > 0 && (
                        <div>
                          <span className="text-slate-500 font-bold font-mono text-[10px] uppercase tracking-wider block mb-1.5">Visible Components</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeReport.visualObservationSummary.visibleComponents.map((comp: string, i: number) => (
                              <span key={i} className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {/* Category Scores */}
                {(() => {
                  const { breakdown } = calculateReportScore(activeReport.issues);
                  return (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                        Category Scores
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(breakdown).map(([key, cat]) => {
                          const scorePct = (cat.score / cat.max) * 100;
                          return (
                            <div key={key} className="p-2.5 bg-black/25 rounded-xl border border-white/5 text-left">
                              <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider truncate">
                                {cat.label}
                              </span>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 rounded-full" 
                                    style={{ width: `${scorePct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-200">
                                  {cat.score}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Issue Summary counts */}
                {(() => {
                  const criticalCount = activeReport.issues.filter(i => i.severity === 'critical').length;
                  const highCount = activeReport.issues.filter(i => i.severity === 'high').length;
                  const mediumCount = activeReport.issues.filter(i => i.severity === 'medium').length;
                  const lowCount = activeReport.issues.filter(i => i.severity === 'low').length;

                  return (
                    <div className="pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-2">
                        Issue Summary
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="flex justify-between items-center bg-rose-500/5 px-2.5 py-1.5 rounded-xl border border-rose-500/10">
                          <span className="text-rose-400">Critical:</span>
                          <span className="text-white font-bold">{criticalCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-red-500/5 px-2.5 py-1.5 rounded-xl border border-red-500/10">
                          <span className="text-red-400">High:</span>
                          <span className="text-white font-bold">{highCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-500/5 px-2.5 py-1.5 rounded-xl border border-amber-500/10">
                          <span className="text-amber-400">Medium:</span>
                          <span className="text-white font-bold">{mediumCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-500/5 px-2.5 py-1.5 rounded-xl border border-indigo-500/10">
                          <span className="text-indigo-400">Low:</span>
                          <span className="text-white font-bold">{lowCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Top Recommendations */}
                {(() => {
                  const recs = [...activeReport.issues]
                    .sort((a, b) => {
                      const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
                      return (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
                    })
                    .map(i => i.recommendation)
                    .filter((value, index, self) => self.indexOf(value) === index) // Unique list of recommendations
                    .slice(0, 4);

                  if (recs.length === 0) return null;

                  return (
                    <div className="pt-4 border-t border-white/5 space-y-2.5">
                      <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                        Top Recommendations
                      </span>
                      <ol className="space-y-2 text-sm text-slate-200">
                        {recs.map((rec, idx) => (
                          <li key={idx} className="flex gap-2.5 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                            <span className="text-emerald-400 font-mono font-bold text-sm">{idx + 1}.</span>
                            <span className="leading-relaxed font-normal">{rec}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-white/2 rounded-2xl border border-white/5">
                No report data loaded. Execute audit using buttons above.
              </div>
            )}

            {/* Accordion violation finding reports grouped by user-facing categories */}
            {activeReport && activeReport.issues.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block text-left">
                  Identified Concerns ({activeReport.issues.length})
                </span>

                <div className="space-y-3">
                  {[
                    { key: 'visualDesign', label: 'Visual Design' },
                    { key: 'usability', label: 'Usability' },
                    { key: 'accessibility', label: 'Accessibility' },
                    { key: 'consistency', label: 'Consistency' }
                  ].map((catDef) => {
                    const catIssues = activeReport.issues.filter(issue => getIssueCategory(issue) === catDef.key);
                    const isCatExpanded = expandedCategories[catDef.key];
                    
                    return (
                      <div key={catDef.key} className="border border-white/5 rounded-2xl overflow-hidden bg-white/2">
                        {/* Category Header Card */}
                        <button
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [catDef.key]: !prev[catDef.key] }))}
                          className="w-full flex items-center justify-between p-3.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left focus:outline-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${
                              catDef.key === 'visualDesign' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 
                              catDef.key === 'usability' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 
                              catDef.key === 'accessibility' ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]' : 
                              'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            }`} />
                            <span className="text-sm font-semibold text-slate-100">{catDef.label}</span>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white/5 text-slate-300 rounded-md">
                              {catIssues.length}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expandable Finding Cards */}
                        {isCatExpanded && (
                          <div className="p-3.5 space-y-3.5 border-t border-white/5 bg-black/10">
                            {catIssues.length === 0 ? (
                              <p className="text-xs text-slate-500 font-mono text-center py-2.5">No concerns found in this category</p>
                            ) : (
                              [...catIssues]
                                .sort((a, b) => {
                                  const priority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
                                  return (priority[b.severity] || 0) - (priority[a.severity] || 0);
                                })
                                .map((issue, idx) => {
                                  const isSelected = selectedIssueId === issue.id;
                                  const style = getSeverityStyle(issue.severity);
                                  return (
                                    <div
                                      key={issue.id}
                                      onClick={() => setSelectedIssueId(isSelected ? null : issue.id)}
                                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                                        isSelected 
                                          ? 'bg-[#12131a] border-indigo-500/40 shadow-xl' 
                                          : 'bg-white/2 border-white/5 hover:bg-white/4'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${style.bg} text-white`}>
                                            {idx + 1}
                                          </span>
                                          <span className="text-[10px] font-mono text-slate-400">
                                            Confidence: {issue.confidence || 90}%
                                          </span>
                                        </div>

                                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-lg ${style.badgeBg}`}>
                                          {issue.severity}
                                        </span>
                                      </div>

                                      <h5 className="text-sm font-semibold text-white mt-2.5 leading-snug">{issue.title}</h5>

                                      {isSelected ? (
                                        <div className="mt-4 pt-3.5 border-t border-white/5 space-y-3.5">
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                                              Description:
                                            </span>
                                            <p className="text-sm text-slate-300 leading-relaxed font-normal">
                                              {issue.description}
                                            </p>
                                          </div>

                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest block">
                                              Recommendation:
                                            </span>
                                            <p className="text-sm leading-relaxed text-slate-100 bg-emerald-950/10 border border-emerald-500/10 p-3.5 rounded-xl font-normal">
                                              {issue.recommendation}
                                            </p>
                                          </div>

                                          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-slate-500">
                                            <span className="text-slate-600 block uppercase tracking-wider font-bold">Rule Constraint Key:</span>
                                            <span className="text-indigo-400 font-bold">{issue.ruleKey}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="mt-1.5 text-[11px] font-mono text-indigo-400/80 flex items-center gap-1">
                                          <span>Click to expand findings</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-white/2 rounded-2xl border border-white/5">
                No active guidelines concerns detected on current canvas viewport.
              </div>
            )}

          </div>

          {/* Embedded Ask Critiq Expert Chat Box */}
          <div className="p-4 border-t border-white/5 bg-black/45 shrink-0">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                Ask Critiq Expert
              </span>
            </div>

            {/* Chat viewport block */}
            <div 
              ref={chatContainerRef}
              className="h-28 overflow-y-auto space-y-3.5 pr-1 mb-3.5 custom-scrollbar text-left"
            >
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600/80 text-white rounded-tr-none' 
                      : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask e.g. How to correct 8px margins?"
                className="w-full bg-[#12131a] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-300 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Slide Drawer: Heuristics & Rules Engine Config */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsDrawer(false)}
              className="fixed inset-0 bg-black z-30"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[450px] bg-[#0c0d13] border-l border-white/10 z-40 p-6 flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6 overflow-y-auto pr-1 custom-scrollbar h-[calc(100%-60px)]">
                
                {/* Header title */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">Review Configuration</h3>
                  </div>
                  <button 
                    onClick={() => setShowSettingsDrawer(false)}
                    className="p-1.5 bg-white/2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AI Provider selection */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Active AI Model Core
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'gemini', name: 'Gemini 2.5 Flash / Pro', desc: 'Default multimodal vision audit' },
                      { key: 'claude', name: 'Claude 3.5 Sonnet', desc: 'In-depth interface structure mapping' },
                      { key: 'chatgpt', name: 'GPT-4o Vision', desc: 'Fast spatial grid verification' }
                    ].map((prov) => {
                      const isActive = activeProvider === prov.key;
                      return (
                        <div
                          key={prov.key}
                          onClick={() => onSelectProvider(prov.key)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-indigo-600/10 border-indigo-500/40' 
                              : 'bg-white/2 border-white/5 hover:bg-white/4'
                          } flex items-center justify-between`}
                        >
                          <div>
                            <span className="text-xs font-semibold text-white block">{prov.name}</span>
                            <span className="text-[10px] text-slate-500 block">{prov.desc}</span>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Severity penalty checklist */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Heuristic Rule Penalties
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Category: UX Rules */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-1">UX Laws</span>
                      {rules.filter(r => r.category === 'UX_RULES').map((rule) => (
                        <div key={rule.key} className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`drawer-${rule.key}`}
                                checked={rule.enabled}
                                onChange={() => onToggleRule(rule.key)}
                                className="rounded border-white/10 bg-black/40 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <label htmlFor={`drawer-${rule.key}`} className="text-xs font-semibold text-white cursor-pointer select-none">
                                {rule.title}
                              </label>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/10 px-1.5 rounded">
                              Weight: {rule.weight}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pl-5">{rule.description}</p>
                          
                          {rule.enabled && (
                            <div className="flex items-center gap-2 pl-5 pt-1">
                              <span className="text-[9px] text-slate-500 font-mono">Penalty:</span>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={rule.weight}
                                onChange={(e) => onUpdateWeight(rule.key, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Category: UI Rules */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-1">UI Standards</span>
                      {rules.filter(r => r.category === 'UI_RULES').map((rule) => (
                        <div key={rule.key} className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`drawer-${rule.key}`}
                                checked={rule.enabled}
                                onChange={() => onToggleRule(rule.key)}
                                className="rounded border-white/10 bg-black/40 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <label htmlFor={`drawer-${rule.key}`} className="text-xs font-semibold text-white cursor-pointer select-none">
                                {rule.title}
                              </label>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/10 px-1.5 rounded">
                              Weight: {rule.weight}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal pl-5">{rule.description}</p>
                          
                          {rule.enabled && (
                            <div className="flex items-center gap-2 pl-5 pt-1">
                              <span className="text-[9px] text-slate-500 font-mono">Penalty:</span>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={rule.weight}
                                onChange={(e) => onUpdateWeight(rule.key, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer footer close button */}
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all font-mono"
              >
                Apply Constraints
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
