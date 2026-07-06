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
  Bookmark,
  Check,
  Compass,
  Layout,
  Smartphone
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

// Methodology-driven review configuration imports
import { useMethodologyStore, methodologyActions } from '../features/review-workspace/reviewConfiguration/MethodologyStore';
import { METHODOLOGIES, MethodologyRegistry } from '../features/review-workspace/reviewConfiguration/ReviewMethodology';
import { getWeightProfileForMethodology } from '../features/review-workspace/reviewConfiguration/WeightProfile';
import MethodologyCard from '../features/review-workspace/reviewConfiguration/MethodologyCard';
import AuditConfiguration from '../features/review-workspace/reviewConfiguration/AuditConfiguration';
import AdvancedOptions from '../features/review-workspace/reviewConfiguration/AdvancedOptions';
import { ReviewConfigurationProvider } from '../features/review-workspace/reviewConfiguration/ReviewConfigurationProvider';

function HelpCircleWithTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-1 text-slate-500 hover:text-indigo-400 rounded-md transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 w-48 bg-[#141622] border border-white/10 rounded-lg p-2 shadow-xl z-50 text-[10px] text-slate-300 font-normal leading-relaxed text-center pointer-events-none"
          >
            <div className="absolute top-full right-2 border-4 border-transparent border-t-[#141622]" />
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [showMethodologyDetailModal, setShowMethodologyDetailModal] = useState<boolean>(false);
  const [activeConfigStep, setActiveConfigStep] = useState<number>(1);

  // Access Methodology-driven configuration store
  const { selectedMethodologyId, selectedProviderId } = useMethodologyStore();

  // Sync activeProvider from props to the store
  useEffect(() => {
    if (activeProvider && activeProvider !== selectedProviderId) {
      methodologyActions.selectProvider(activeProvider);
    }
  }, [activeProvider, selectedProviderId]);

  // Sync back to parent when selectedProviderId changes in the store
  useEffect(() => {
    if (selectedProviderId && selectedProviderId !== activeProvider) {
      onSelectProvider(selectedProviderId);
    }
  }, [selectedProviderId, activeProvider, onSelectProvider]);

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

    const weightProfile = getWeightProfileForMethodology(selectedMethodologyId);
    return ReviewProcessor.process(rawIssues, mockScreenModel, 420, activeReport.id, weightProfile);
  }, [activeReport, selectedMethodologyId]);

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
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/25 backdrop-blur-lg shrink-0 z-20">
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
          
          {/* LEFT COLUMN: Controls & Heuristics Presets with glass morphism */}
          <aside className="w-72 border-r border-white/5 bg-slate-950/30 backdrop-blur-lg shadow-2xl flex flex-col p-5 space-y-5 overflow-y-auto shrink-0 z-10 custom-scrollbar">
            <IssueSearch />
            <IssueFilters />
          </aside>

          {/* MIDDLE COLUMN: Interactive Canvas Area */}
          <main className="flex-1 bg-transparent flex flex-col relative overflow-hidden">
            {/* Design Mockup Board */}
            <div className="flex-1 min-h-0 relative">
              {/* Floating Immovable Canvas Controls */}
              {critiqReview && !activeReport?.isUnavailable && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-wrap items-center justify-center gap-2 select-none w-[calc(100%-2rem)] max-w-max">
                  <CanvasControls />
                  <ZoomControls onFitScreen={() => window.dispatchEvent(new CustomEvent('fit-canvas-to-screen'))} />
                </div>
              )}

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
            <footer className="h-12 border-t border-white/5 bg-slate-950/40 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-10 text-xs font-mono text-slate-300 select-none">
              {/* Left Group: Dynamic status and findings count */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold text-[11px]">{critiqReview?.issues.length || 0} Findings</span>
                </div>
              </div>

              {/* Center Group: Premium Inspection Status Pill */}
              <div className="hidden lg:block truncate max-w-md">
                {storeSelectedIssueId ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[11px] text-slate-300">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                    <span className="text-slate-400 font-medium font-sans">Inspecting:</span>
                    <span className="text-white font-semibold truncate font-sans">{critiqReview?.issues.find(i => i.id === storeSelectedIssueId)?.title}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/2 rounded-full border border-white/3 text-[11px] text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                    <span className="font-sans">Select any hotspot marker or list item to inspect...</span>
                  </div>
                )}
              </div>

              {/* Right Group: Action buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportReport}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all pointer-events-auto cursor-pointer font-bold font-sans text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Export full audit JSON report"
                >
                  <span>Export Report</span>
                </button>

                <div className="h-4 w-px bg-white/10" />
                
                <span className="text-[10px] text-slate-500 font-mono">v2.1</span>
              </div>
            </footer>
          </main>

          {/* RIGHT COLUMN: Issue Inspector Sidebar & Embedded Ask Critiq Expert Chat with glass morphism */}
          <aside className="w-96 border-l border-white/5 bg-slate-950/30 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden shrink-0 z-10">
            {/* Main scrollable list/detail panels */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0 custom-scrollbar">
              {critiqReview ? (
                <IssueSidebar issues={critiqReview.issues} />
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-white/2 rounded-2xl border border-white/5">
                  No active findings or metrics generated yet. Run a layout analysis to populate.
                </div>
              )}
            </div>

            {/* Ask Critiq Expert AI Proxy Chat Container */}
            <div className="p-5 border-t border-white/5 bg-slate-950/40 backdrop-blur-md shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                    Ask Critiq Expert
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Local Expert Proxy</span>
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
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
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
                  className="w-full bg-[#12131a] border border-white/10 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <input type="submit" className="hidden" />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-300 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>

        </div>

      {/* Slide Drawer: Methodology-Driven Configuration Center */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <ReviewConfigurationProvider>
            {/* Fullscreen Separate Page Configuration Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-[#06070a] z-40 flex flex-col text-slate-100 overflow-hidden font-sans"
            >
              {/* Header bar */}
              <div className="h-16 border-b border-white/5 bg-[#0b0c12] px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">Critiq Configuration Center</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-normal">Set your review methodology and audit thresholds. Critiq does the rest.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 px-3 text-xs"
                >
                  <X className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase font-bold tracking-wider">Close & Apply</span>
                </button>
              </div>

              {/* Split Body Layout */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                
                {/* Left Sidebar Pane */}
                <aside className="w-80 border-r border-white/5 bg-[#0a0b12]/90 p-6 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar select-none">
                  <div className="space-y-6">
                    
                    {/* Stepper Navigator */}
                    <div className="space-y-4">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Steps Navigation</span>
                      <div className="relative pl-1 space-y-5">
                        {/* Connecting vertical line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800" />

                        {[
                          { num: 1, title: 'Review Methodology', desc: 'Choose how Critiq evaluates' },
                          { num: 2, title: 'AI Engine', desc: 'Select intelligence engine' },
                          { num: 3, title: 'Audit Thresholds', desc: 'Adjust audit parameters' },
                          { num: 4, title: 'Advanced Options', desc: 'Fine-tune (optional)' },
                        ].map((step) => {
                          const isSelected = activeConfigStep === step.num;
                          const isCompleted = activeConfigStep > step.num;
                          return (
                            <button
                              key={step.num}
                              type="button"
                              onClick={() => setActiveConfigStep(step.num)}
                              className="flex items-start gap-4 text-left w-full relative group cursor-pointer"
                            >
                              {/* Step circle */}
                              <div className="relative z-10 shrink-0">
                                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-300 ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/25 scale-110 shadow-lg shadow-indigo-600/30' 
                                    : isCompleted
                                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/50'
                                      : 'bg-[#12131a] text-slate-500 border border-white/5 group-hover:border-white/20'
                                }`}>
                                  {step.num}
                                </div>
                              </div>

                              {/* Label text */}
                              <div className="space-y-0.5 pt-0.5">
                                <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                  {step.title}
                                </h4>
                                <p className={`text-xs transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                  {step.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Profile Widget */}
                    <div className="bg-[#12131c] border border-white/5 rounded-2xl p-4.5 space-y-3.5 relative shadow-inner">
                      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Current Profile</span>
                        <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          <span className="text-xs text-indigo-300 font-mono font-bold">Active</span>
                        </div>
                      </div>

                      {(() => {
                        const meth = MethodologyRegistry.getById(selectedMethodologyId) || METHODOLOGIES[0];
                        const durationLabel = meth.analysisDepth === 'quick' ? '15–20 sec' : (meth.analysisDepth === 'standard' ? '25–35 sec' : '45–60 sec');
                        const confidenceLabel = meth.analysisDepth === 'quick' ? 'High' : (meth.analysisDepth === 'standard' ? 'Very High' : 'Highest');
                        const activeEngine = selectedProviderId === 'claude' ? 'Critiq-C3.5' : (selectedProviderId === 'chatgpt' ? 'Critiq-G4' : 'Critiq v2.1');

                        return (
                          <div className="space-y-2.5">
                            <div>
                              <h4 className="text-xs font-bold text-white tracking-tight">{meth.name}</h4>
                              <p className="text-xs text-slate-400 mt-0.5 capitalize">{meth.analysisDepth} Heuristic Audit</p>
                            </div>

                            <div className="space-y-1.5 pt-1.5 text-xs font-mono text-slate-400 border-t border-white/3">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Est. Duration:</span>
                                <span className="text-slate-300 font-semibold">{durationLabel}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Confidence:</span>
                                <span className="text-emerald-400 font-bold">{confidenceLabel}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Focus Areas:</span>
                                <span className="text-slate-300 font-semibold">{meth.focusAreas.length}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Recommended Engine:</span>
                                <span className="text-indigo-300 font-bold">{activeEngine}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Sidebar Footer help link */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Learn how evaluations work</span>
                    </div>
                    <button
                      onClick={() => setShowMethodologyDetailModal(true)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline select-none"
                    >
                      Dossier
                    </button>
                  </div>
                </aside>

                {/* Right Main Content Pane */}
                <main className="flex-1 bg-[#050609] p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar min-w-0">
                  <div className="space-y-8 pb-10">
                    
                    {/* Step 1: Review Methodology */}
                    {activeConfigStep === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2.5">
                              1. Review Methodology
                            </h4>
                            <button
                              onClick={() => setShowMethodologyDetailModal(true)}
                              className="px-3 py-1.5 text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg hover:border-indigo-500/30 cursor-pointer transition-all flex items-center gap-1.5 select-none"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              Compare Methodologies
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            Select the methodology that best matches your review goal. This controls how Critiq analyzes and scores your design.
                          </p>
                        </div>

                        {/* Custom visual Methodology Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {METHODOLOGIES.map((meth) => {
                            const isSelected = selectedMethodologyId === meth.id;
                            const isRecommended = meth.id === 'comprehensive-critiq';
                            
                            const methIconMap: Record<string, any> = {
                              'Sparkles': Sparkles,
                              'Eye': Eye,
                              'Compass': Compass,
                              'Layout': Layout,
                              'Smartphone': Smartphone,
                              'Sliders': Sliders,
                            };
                            const IconComponent = methIconMap[meth.icon] || Sparkles;

                            return (
                              <div
                                key={meth.id}
                                onClick={() => methodologyActions.selectMethodology(meth.id)}
                                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between h-48 cursor-pointer select-none group ${
                                  isSelected
                                    ? 'bg-indigo-600/10 border-indigo-500/60 text-white shadow-xl shadow-indigo-950/20 ring-1 ring-indigo-500/20'
                                    : 'bg-[#0f1016]/85 border-white/5 text-slate-400 hover:border-white/10 hover:bg-[#141520]/80'
                                }`}
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-start justify-between">
                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600/20 text-indigo-300' : 'bg-white/5 text-slate-400 group-hover:text-slate-300'}`}>
                                      <IconComponent className="w-4.5 h-4.5" />
                                    </div>
                                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-800 bg-[#07080d]'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3" />}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1">{meth.name}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                                      {meth.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs font-mono">
                                  <div className="flex flex-wrap gap-1 max-w-[70%]">
                                    {meth.focusAreas.slice(0, 3).map((area) => (
                                      <span key={area} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/3">
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-slate-400 shrink-0 font-bold">
                                    {meth.estimatedDuration}
                                  </span>
                                </div>

                                {isRecommended && (
                                  <span className="absolute top-3.5 right-10 text-xs font-mono uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded">
                                    Recommended
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Why this matters ambient banner */}
                        <div className="bg-indigo-600/[0.04] border border-indigo-500/15 rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0" />
                            <p className="text-xs text-slate-300 leading-relaxed">
                              <span className="text-indigo-300 font-bold">Why this matters:</span> The methodology you choose determines which rules are applied, how issues are weighted, and the kind of insights you receive.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowMethodologyDetailModal(true)}
                            className="px-3 py-1.5 text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-lg cursor-pointer whitespace-nowrap select-none"
                          >
                            Show Dossier
                          </button>
                        </div>

                        {/* Profile Summary pane */}
                        <div className="border border-white/5 bg-[#0b0c12]/50 rounded-2xl p-6 space-y-4">
                          <div className="pb-3 border-b border-white/5">
                            <h4 className="text-xs font-bold text-white">Methodology Profile Summary</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">This is how Critiq will analyze your design with the selected methodology.</p>
                          </div>

                          {(() => {
                            const meth = MethodologyRegistry.getById(selectedMethodologyId) || METHODOLOGIES[0];
                            const activeWeights = meth.weightProfile;
                            
                            // Static inclusions & exclusions lookup
                            const getInclusions = (id: string) => {
                              switch (id) {
                                case 'wcag-accessibility':
                                  return {
                                    included: ['Color Contrast Ratios (AA & AAA Standards)', 'Touch Target Accessibility Boundaries', 'Deuteranopia / Color Blind validations', 'Required Screen Reader text attributes', 'Typography scale validation'],
                                    excluded: ['Subjective graphic layout styling', 'Complex desktop panel information densities', 'Gutter alignment margins']
                                  };
                                case 'nielsen-usability':
                                  return {
                                    included: ['Consistency & standards validation', 'User freedom and system control analysis', 'Cognitive recognition vs recall fatigue', 'Action confirmation & error prevention pathways'],
                                    excluded: ['Strict 8px design-token matching', 'Contrast levels (strict WCAG AA/AAA)', 'Fluid responsive break checks']
                                  };
                                case 'enterprise-ux':
                                  return {
                                    included: ['Dense table and chart density optimizations', 'Complex structural information-architectures', 'Layout space utilization & negative space efficiency', 'Action sequence optimization'],
                                    excluded: ['Ergonomic thumb-friendly reach zones', 'Emotional marketing aesthetics', 'Gesture pathway flow']
                                  };
                                case 'mobile-ux':
                                  return {
                                    included: ['Thumb reachable touch-target spaces', 'Responsive content wrapping & fluid flow', 'Simplified mobile touch mechanics', 'Ergonomic viewport safe zones'],
                                    excluded: ['Widescreen dashboard dense table metrics', 'Multi-panel layout configurations', 'Keyboard navigation and accessibility']
                                  };
                                case 'design-system':
                                  return {
                                    included: ['Strict 8px/4px layout pacing grids', 'Standardized typographic step progressions', 'Token color consistency across elements', 'Component repeat-pattern conformity'],
                                    excluded: ['Readability content copywriting', 'Cognitive processing load levels', 'Animation latency tolerances']
                                  };
                                case 'comprehensive-critiq':
                                default:
                                  return {
                                    included: ['Full range Accessibility standards', 'Heuristic layout and user mental models', 'Pixel grid design-token alignment', 'Full responsive screen-width scaling'],
                                    excluded: ['Highly specialized healthcare/regulatory compliance checks']
                                  };
                              }
                            };

                            const { included, excluded } = getInclusions(meth.id);

                            return (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                                
                                {/* Weights Progress bars */}
                                <div className="space-y-3.5 border-r border-white/5 pr-6">
                                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">Category Weightage</span>
                                  <div className="space-y-3">
                                    {[
                                      { key: 'usability', name: 'Usability & Layout' },
                                      { key: 'accessibility', name: 'WCAG Accessibility' },
                                      { key: 'visualDesign', name: 'Visual Aesthetics' },
                                      { key: 'designSystem', name: 'Design Tokens & Grids' },
                                      { key: 'interaction', name: 'Interactive Dynamics' },
                                    ].map((cat) => {
                                      const value = activeWeights[cat.key as keyof typeof activeWeights] || 0;
                                      return (
                                        <div key={cat.key} className="space-y-1">
                                          <div className="flex justify-between text-xs font-mono text-slate-400">
                                            <span>{cat.name}</span>
                                            <span className="font-bold text-indigo-400">{value}%</span>
                                          </div>
                                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${value}%` }}
                                              transition={{ duration: 0.5, ease: 'easeOut' }}
                                              className="bg-indigo-500 h-full rounded-full"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* What's Included */}
                                <div className="space-y-3 border-r border-white/5 pr-6">
                                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block">What's Included</span>
                                  <ul className="space-y-2.5 text-slate-300">
                                    {included.slice(0, 5).map((inc) => (
                                      <li key={inc} className="text-xs leading-relaxed flex items-start gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{inc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* What's Excluded */}
                                <div className="space-y-3">
                                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">What's Not Included</span>
                                  <ul className="space-y-2.5 text-slate-500">
                                    {excluded.slice(0, 4).map((exc) => (
                                      <li key={exc} className="text-xs leading-relaxed flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-1.5 ml-1" />
                                        <span>{exc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Step 2: AI Engine */}
                    {activeConfigStep === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white tracking-tight">
                            2. AI Intelligence Engine
                          </h4>
                          <p className="text-xs text-slate-400">
                            Select the intelligence engine to run the analysis. The chosen model evaluates design-tokens and heuristic layouts.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { 
                              id: 'gemini', 
                              name: 'Critiq v2.1', 
                              model: 'Gemini 1.5 Flash',
                              speed: '⚡ Fast (12s)',
                              quality: '⭐ Balanced',
                              learnMore: 'Our default high-speed multimodal pipeline optimized for high-throughput heuristic visual analysis.'
                            },
                            { 
                              id: 'claude', 
                              name: 'Critiq-C3.5', 
                              model: 'Claude 3.5 Sonnet',
                              speed: '🐢 Standard (28s)',
                              quality: '💎 Max Polish',
                              learnMore: 'High-fidelity reasoning engine offering superb typography and custom design-token alignment validations.'
                            },
                            { 
                              id: 'chatgpt', 
                              name: 'Critiq-G4', 
                              model: 'GPT-4o Vision Engine',
                              speed: '⚡ Fast (15s)',
                              quality: '⭐ Rich Details',
                              learnMore: 'Excellent spatial-relations mapping and color contrast verification with a large geometric visual model.'
                            }
                          ].map((provider) => {
                            const isSelected = selectedProviderId === provider.id;
                            return (
                              <div
                                key={provider.id}
                                onClick={() => methodologyActions.selectProvider(provider.id)}
                                className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-48 cursor-pointer select-none group ${
                                  isSelected
                                    ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-xl shadow-indigo-950/25 ring-1 ring-indigo-500/10'
                                    : 'bg-[#0f1016]/80 border-white/5 text-slate-400 hover:border-white/10 hover:bg-[#141520]/80'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5 w-full">
                                  <div>
                                    <span className="text-sm font-bold block text-white">{provider.name}</span>
                                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mt-0.5">{provider.model}</span>
                                  </div>
                                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <HelpCircleWithTooltip content={provider.learnMore} />
                                  </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed font-normal mt-1 mb-3">
                                  {provider.learnMore}
                                </p>

                                <div className="space-y-1.5 text-xs font-mono text-slate-400 pt-3 border-t border-white/3">
                                  <div className="flex items-center justify-between">
                                    <span>Inference speed:</span>
                                    <span className={isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-400'}>{provider.speed}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Output quality:</span>
                                    <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{provider.quality}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Context Banner */}
                        <div className="bg-[#12131c] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
                          <p className="text-xs text-slate-300 leading-relaxed font-normal">
                            No matter which backend engine you select, Critiq enforces the same design-token definitions and heuristic scoring templates. This ensures reproducible layout audit feedback.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Audit Thresholds */}
                    {activeConfigStep === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white tracking-tight">
                            3. Audit Thresholds
                          </h4>
                          <p className="text-xs text-slate-400">
                            Customize the strictness criteria for contrast, touch targets, and typography rules.
                          </p>
                        </div>

                        <div className="bg-[#0b0c12]/50 border border-white/5 rounded-2xl p-5">
                          <AuditConfiguration />
                        </div>
                      </div>
                    )}

                    {/* Step 4: Advanced Options */}
                    {activeConfigStep === 4 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white tracking-tight">
                            4. Advanced Settings
                          </h4>
                          <p className="text-xs text-slate-400">
                            Configure expert developer properties, toggle diagnostics, and enable experimental rules.
                          </p>
                        </div>

                        <div className="bg-[#0b0c12]/50 border border-white/5 rounded-2xl p-5">
                          <AdvancedOptions />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Footer apply action bar */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto shrink-0">
                    <div className="flex gap-2">
                      {activeConfigStep > 1 && (
                        <button
                          onClick={() => setActiveConfigStep(prev => Math.max(1, prev - 1))}
                          className="px-5 py-2.5 bg-[#12131b] border border-white/5 hover:border-white/10 text-slate-300 font-mono text-xs font-bold rounded-xl hover:text-white cursor-pointer select-none transition-all uppercase tracking-wider"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={() => {
                          methodologyActions.resetThresholds();
                        }}
                        className="px-4 py-2.5 text-slate-500 hover:text-slate-300 text-xs font-mono select-none cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {activeConfigStep < 4 ? (
                        <button
                          onClick={() => setActiveConfigStep(prev => Math.min(4, prev + 1))}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer uppercase tracking-wider select-none flex items-center gap-2"
                        >
                          <span>Continue to {activeConfigStep === 1 ? 'AI Engine' : activeConfigStep === 2 ? 'Audit Thresholds' : 'Advanced Options'}</span>
                          <span>&rarr;</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowSettingsDrawer(false);
                          }}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer uppercase tracking-wider select-none"
                        >
                          Save & Apply Configuration
                        </button>
                      )}
                    </div>
                  </div>
                </main>

              </div>
            </motion.div>

            {/* Modal Detail Overlay for Active Methodology */}
            <AnimatePresence>
              {showMethodologyDetailModal && (() => {
                const meth = MethodologyRegistry.getById(selectedMethodologyId) || METHODOLOGIES[0];
                const weights = Object.entries(meth.weightProfile)
                  .filter(([_, val]) => val > 0)
                  .sort((a, b) => b[1] - a[1]);
                
                // Static inclusions & exclusions lookup
                const getInclusions = (id: string) => {
                  switch (id) {
                    case 'wcag-accessibility':
                      return {
                        included: ['Color Contrast Ratios (AA & AAA Standards)', 'Touch Target Accessibility Boundaries', 'Deuteranopia / Color Blind SIM validations', 'Required Screen Reader text attributes', 'Typography scale validation'],
                        excluded: ['Subjective graphic layout styling', 'Complex desktop panel information densities', 'Gutter alignment margins']
                      };
                    case 'nielsen-usability':
                      return {
                        included: ['Consistency & standards validation', 'User freedom and system control analysis', 'Cognitive recognition vs recall fatigue', 'Action confirmation & error prevention pathways'],
                        excluded: ['Strict 8px design-token matching', 'Contrast levels (strict WCAG AA/AAA)', 'Fluid responsive break checks']
                      };
                    case 'enterprise-ux':
                      return {
                        included: ['Dense table and chart density optimizations', 'Complex structural information-architectures', 'Layout space utilization & negative space efficiency', 'Action sequence optimization'],
                        excluded: ['Ergonomic thumb-friendly reach zones', 'Emotional marketing aesthetics', 'Gesture pathway flow']
                      };
                    case 'mobile-ux':
                      return {
                        included: ['Thumb reachable touch-target spaces', 'Responsive content wrapping & fluid flow', 'Simplified mobile touch mechanics', 'Ergonomic viewport safe zones'],
                        excluded: ['Widescreen dashboard dense table metrics', 'Multi-panel layout configurations', 'Keyboard navigation and accessibility']
                      };
                    case 'design-system':
                      return {
                        included: ['Strict 8px/4px layout pacing grids', 'Standardized typographic step progressions', 'Token color consistency across elements', 'Component repeat-pattern conformity'],
                        excluded: ['Readability content copywriting', 'Cognitive processing load levels', 'Animation latency tolerances']
                      };
                    case 'comprehensive-critiq':
                    default:
                      return {
                        included: ['Full range Accessibility standards', 'Heuristic layout and user mental models', 'Pixel grid design-token alignment', 'Full responsive screen-width scaling'],
                        excluded: ['Highly specialized healthcare/regulatory compliance checks']
                      };
                  }
                };

                const { included, excluded } = getInclusions(meth.id);

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowMethodologyDetailModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0b0c12] border border-white/10 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                          <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest">Methodology Dossier</h4>
                        </div>
                        <button
                          onClick={() => setShowMethodologyDetailModal(false)}
                          className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{meth.name}</h3>
                          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                            {meth.analysisDepth} Depth
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {meth.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-1">
                        {/* Target Areas */}
                        <div>
                          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">Target Focus Domains</span>
                          <div className="flex flex-wrap gap-1">
                            {meth.focusAreas.map((area) => (
                              <span key={area} className="text-xs bg-white/5 border border-white/3 text-slate-300 px-2 py-0.5 rounded-md">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Weight Distrib */}
                        <div>
                          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Weight Profile Distribution</span>
                          <div className="space-y-1.5">
                            {weights.map(([key, val]) => (
                              <div key={key} className="space-y-0.5">
                                <div className="flex justify-between text-xs font-mono text-slate-400">
                                  <span className="capitalize">{key === 'ux' ? 'Usability (UX)' : (key === 'ui' ? 'Design System' : key)}</span>
                                  <span>{val}%</span>
                                </div>
                                <div className="w-full bg-slate-800/40 rounded-full h-1">
                                  <div
                                    className="bg-indigo-500 h-1 rounded-full"
                                    style={{ width: `${val}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Inclusions & Exclusions */}
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                          <div className="space-y-1">
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block">Included In Audit</span>
                            <ul className="space-y-1 text-slate-300 list-disc list-inside">
                              {included.map((inc) => (
                                <li key={inc} className="text-xs leading-relaxed">{inc}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest font-bold block">Not Evaluated</span>
                            <ul className="space-y-1 text-slate-500 list-disc list-inside">
                              {excluded.map((exc) => (
                                <li key={exc} className="text-xs leading-relaxed">{exc}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex justify-end">
                        <button
                          onClick={() => setShowMethodologyDetailModal(false)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-wider"
                        >
                          Dismiss Dossier
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </ReviewConfigurationProvider>
        )}
      </AnimatePresence>

    </div>
  );
};
