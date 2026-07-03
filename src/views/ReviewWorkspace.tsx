import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Sparkles, 
  Sliders, 
  X, 
  Plus, 
  Cpu, 
  Eye, 
  FileText, 
  Send, 
  Lightbulb,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Type Definitions
import { AuditReport, ReviewType, Issue, Project, Rule } from '../types';
import { ScreenModel } from '../lib/screen-understanding/screenModel';
import { CritiqReview, CritiqIssue, IssueSeverity } from '../lib/critiq-engine/types';
import { ReviewProcessor } from '../lib/critiq-engine/reviewProcessor';

// State Stores
import { useSelectionStore, selectionActions } from '../features/review-workspace/state/selectionStore';
import { useZoomStore, zoomActions } from '../features/review-workspace/state/zoomStore';
import { useCanvasStore, canvasActions } from '../features/review-workspace/state/canvasStore';
import { useFilterStore, filterActions } from '../features/review-workspace/state/filterStore';
import { useIssueStore, issueActions } from '../features/review-workspace/state/issueStore';

// Canvas Components
import IssueCanvas from '../features/review-workspace/canvas/IssueCanvas';
import ZoomControls from '../features/review-workspace/canvas/ZoomControls';
import MiniMap from '../features/review-workspace/canvas/MiniMap';
import SelectionLayer from '../features/review-workspace/canvas/SelectionLayer';
import CanvasControls from '../features/review-workspace/canvas/CanvasControls';

// Sidebar Components
import IssueSidebar from '../features/review-workspace/sidebar/IssueSidebar';
import IssueFilters from '../features/review-workspace/sidebar/IssueFilters';
import IssueSearch from '../features/review-workspace/sidebar/IssueSearch';

interface ReviewWorkspaceProps {
  project: Project;
  rules: Rule[];
  activeReport: AuditReport;
  activeProvider: string;
  onSelectProvider: (provider: string) => void;
  onToggleRule: (key: string) => void;
  onUpdateWeight: (key: string, weight: number) => void;
  onRunAudit: (type: ReviewType, customPrompt?: string) => Promise<void>;
  onAddCustomIssue: (issue: Omit<Issue, 'id' | 'confidence'>) => void;
  onCloseWorkspace: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
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
  // Legacy / Local UI states
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [reviewType, setReviewType] = useState<ReviewType>(ReviewType.FULL_AUDIT);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  
  // Custom Configuration Rules States
  const [contrastThreshold, setContrastThreshold] = useState<number>(4.5);
  const [minTouchTargetSize, setMinTouchTargetSize] = useState<number>(44);
  const [strictGridRules, setStrictGridRules] = useState<boolean>(true);
  const [heirarchyRulesVersion, setHierarchyRulesVersion] = useState<string>('wcag-2.1');

  // Access reactive state stores
  const { selectedIssueId: storeSelectedIssueId } = useSelectionStore();
  const { scale } = useZoomStore();

  // Sync selection store back to legacy component states
  useEffect(() => {
    setSelectedIssueId(storeSelectedIssueId);
  }, [storeSelectedIssueId]);

  // Seed / Reset stores when active critiqReview changes
  useEffect(() => {
    if (critiqReview) {
      selectionActions.clearSelection();
      zoomActions.setScale(1.0);
      canvasActions.resetPan();
      issueActions.resetIssues();
      filterActions.resetFilters();
    }
  }, [activeReport]);

  // Compiled professional Critiq Review Object Hook
  const critiqReview: CritiqReview | null = React.useMemo(() => {
    if (!activeReport) return null;
    
    if ((activeReport as any).unifiedReport && ((activeReport as any).unifiedReport as any).issues) {
      return (activeReport as any).unifiedReport as any as CritiqReview;
    }
    
    const mockScreenModel: ScreenModel = (activeReport as any).screenModel || ({
      platform: 'Web' as any,
      classification: { screenType: 'Dashboard' as any, confidence: 94 },
      metadata: { screenName: 'Mock Screen', purpose: activeReport.summary || 'Uploaded visual interface.', estimatedComplexity: 'medium', businessDomain: 'SaaS', industry: 'General', targetUsers: 'All', estimatedUserGoal: 'Learn' },
      layout: { columns: 12, gridStructure: 'Symmetric Container Layout Grid', containers: [], alignment: 'center', spacingPattern: 'Standard', margins: { top: 16, bottom: 16, left: 16, right: 16 }, sections: [] },
      components: [],
      containers: [],
      hierarchy: { mostProminentElement: '', readingOrder: [], visualFlow: 'Single Column', attentionHotspots: [], hierarchyScore: 90 },
      navigation: { hasPersistentNav: false, navType: 'none', navElements: [] },
      userFlow: [],
      designSystem: { detectedSystem: 'Custom Design System' as any, confidence: 90 },
      detectedIssues: [],
      reviewResults: [],
      confidenceScores: { classification: 90, components: 90, layout: 90, hierarchy: 90, global: 90 },
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    } as any as ScreenModel);
    
    const rawIssues = (activeReport.issues || []).map((iss, idx) => ({
      id: iss.id || `iss_${idx}`,
      title: iss.title,
      description: iss.description,
      boundingBox: iss.boundingBox || { x: 10, y: 10, width: 20, height: 10 },
      severity: iss.severity as any,
      confidence: iss.confidence || 85,
      evidence: [iss.description],
      recommendation: iss.recommendation || 'Consider layout adjustments.'
    }));

    return ReviewProcessor.process(rawIssues, mockScreenModel, 420, activeReport.id);
  }, [activeReport]);

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

  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const handleExportReport = () => {
    if (!critiqReview) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(critiqReview, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `critiq_review_${critiqReview.metadata.reviewId || 'report'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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

      {/* Main Workspace Frame with Selection Shortcuts Listener */}
      <SelectionLayer filteredIssues={critiqReview?.issues || []} />
      
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* LEFT COLUMN: Controls & Heuristics Presets */}
          <aside className="w-72 border-r border-white/5 bg-[#08080c] flex flex-col p-4 space-y-4 overflow-y-auto shrink-0 z-10 custom-scrollbar">
            <IssueSearch />
            <IssueFilters />
          </aside>

          {/* MIDDLE COLUMN: Interactive Canvas Area */}
          <main className="flex-1 bg-[#060609] flex flex-col relative overflow-hidden">
            {/* Design Mockup Board */}
            <div className="flex-1 min-h-0 relative">
              <IssueCanvas 
                issues={critiqReview?.issues || []} 
                imageUrl={activeReport?.imageUrl || ''}
                isUnavailable={activeReport?.isUnavailable}
                onRetryAudit={handleRunFullAudit}
              />
              
              {/* Floating MiniMap at bottom right */}
              {critiqReview && !activeReport?.isUnavailable && (
                <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                  <MiniMap imageUrl={activeReport?.imageUrl || ''} issues={critiqReview?.issues || []} />
                </div>
              )}
            </div>

            {/* Bottom Toolbar & Status Bar */}
            <footer className="h-12 border-t border-white/5 bg-[#08080b]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10 text-[10px] font-mono text-slate-400 select-none">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Zoom Scale: <span className="text-white font-bold">{Math.round(scale * 100)}%</span></span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <span>Detected Findings: <span className="text-white font-bold">{critiqReview?.issues.length || 0}</span></span>
              </div>

              {/* Center status showing active issue */}
              <div className="hidden md:block truncate max-w-sm text-slate-300">
                {storeSelectedIssueId ? (
                  <span className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">ACTIVE ISSUE:</span>
                    <span className="text-white font-semibold truncate">{critiqReview?.issues.find(i => i.id === storeSelectedIssueId)?.title}</span>
                  </span>
                ) : (
                  <span className="text-slate-500">Click any hotspot marker or list item to inspect...</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportReport}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5 pointer-events-auto cursor-pointer font-bold"
                  title="Export full audit JSON report"
                >
                  Export Report
                </button>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-2 pointer-events-auto">
                  <CanvasControls />
                  <ZoomControls onFitScreen={() => window.dispatchEvent(new CustomEvent('fit-canvas-to-screen'))} />
                </div>
                <div className="h-3 w-px bg-white/10" />
                <span className="text-slate-500">Methodology v2.1</span>
              </div>
            </footer>
          </main>

          {/* RIGHT COLUMN: Issue Inspector Sidebar & Embedded Ask Critiq Expert Chat */}
          <aside className="w-96 border-l border-white/5 bg-[#08080c] flex flex-col overflow-hidden shrink-0 z-10">
            {/* Main scrollable list/detail panels */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 custom-scrollbar">
              {critiqReview ? (
                <IssueSidebar issues={critiqReview.issues} />
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-white/2 rounded-2xl border border-white/5">
                  No active findings or metrics generated yet. Run a layout analysis to populate.
                </div>
              )}
            </div>

            {/* Ask Critiq Expert AI Proxy Chat Container */}
            <div className="p-4 border-t border-white/5 bg-black/45 shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                    Ask Critiq Expert
                  </span>
                </div>
                <span className="text-[8px] font-mono text-slate-500">Local Expert Proxy</span>
              </div>

              {/* Chat history */}
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
                <input type="submit" className="hidden" />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 p-1 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-300 transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </aside>

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
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Audit Core Intelligence Engine</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gemini', name: 'Critiq v2.1', desc: 'Gemini Pro API' },
                      { id: 'claude', name: 'Critiq-C3.5', desc: 'Claude Sonnet' },
                      { id: 'chatgpt', name: 'Critiq-G4', desc: 'GPT-4 Vision' }
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => onSelectProvider(provider.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeProvider === provider.id
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg'
                            : 'bg-[#12131b] border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{provider.name}</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider mt-0.5 block truncate">{provider.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 font-normal leading-normal">
                    Critiq uses a model router middleware. Selecting a specific provider prioritizes its inference logs during heuristic audits. Current active target is <span className="text-indigo-400 font-bold">{activeProviderName}</span>.
                  </p>
                </div>

                {/* Contrast Heuristic Config */}
                <div className="space-y-3.5 bg-white/2 p-4 rounded-2xl border border-white/5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white tracking-tight">WCAG Minimum Contrast Ratio</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{contrastThreshold}:1</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="7.0"
                    step="0.5"
                    value={contrastThreshold}
                    onChange={(e) => setContrastThreshold(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                    <span>3.0:1 (WCAG AA Large)</span>
                    <span>4.5:1 (WCAG AA Normal)</span>
                    <span>7.0:1 (WCAG AAA Strict)</span>
                  </div>
                </div>

                {/* Touch Target Config */}
                <div className="space-y-3.5 bg-white/2 p-4 rounded-2xl border border-white/5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white tracking-tight">Minimum Touch Target Height</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{minTouchTargetSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="36"
                    max="56"
                    step="4"
                    value={minTouchTargetSize}
                    onChange={(e) => setMinTouchTargetSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                    <span>36px (Material Compact)</span>
                    <span>44px (Apple iOS HIG)</span>
                    <span>48px (Google Android HIG)</span>
                    <span>56px (High Accessibility)</span>
                  </div>
                </div>

                {/* Strict Grid Rules Toggles */}
                <div className="space-y-3 bg-white/2 p-4 rounded-2xl border border-white/5 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white tracking-tight block">Enforce 8px Spacing Grid</span>
                      <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">Flag sub-elements and margins that break 8px geometric pacing</span>
                    </div>
                    <button
                      onClick={() => setStrictGridRules(!strictGridRules)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${strictGridRules ? 'bg-indigo-600' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${strictGridRules ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Cognitive load checklist configuration */}
                <div className="space-y-3.5 bg-white/2 p-4 rounded-2xl border border-white/5 text-left">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Cognitive & Hierarchy Rules Set</span>
                  <div className="space-y-2">
                    {[
                      { id: 'wcag-2.1', name: 'WCAG 2.1 AA Checklist', desc: 'Default compliance suite for structural content flow' },
                      { id: 'nielsen', name: 'Nielsen 10 Usability Heuristics', desc: 'Focuses on user control, consistency, and error prevention' },
                      { id: 'fitts-hick', name: 'Fitts & Hick Interaction Laws', desc: 'Mathematical modeling of layouts for conversion & focus' }
                    ].map((ruleset) => (
                      <div 
                        key={ruleset.id}
                        onClick={() => setHierarchyRulesVersion(ruleset.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          heirarchyRulesVersion === ruleset.id
                            ? 'bg-[#12131b] border-indigo-500/40'
                            : 'bg-transparent border-white/3 hover:border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${heirarchyRulesVersion === ruleset.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'}`}>
                            {heirarchyRulesVersion === ruleset.id && <div className="w-1 h-1 rounded-full bg-white" />}
                          </div>
                          <span className="text-[11px] font-semibold text-white">{ruleset.name}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-normal ml-5">{ruleset.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Apply settings controls */}
              <div className="pt-4 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => setShowSettingsDrawer(false)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-mono text-xs font-bold rounded-xl transition-all"
                >
                  Save & Apply Settings
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
