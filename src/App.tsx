/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Landing from './views/Landing';
import Diagnosing from './views/Diagnosing';
import ReviewWorkspace from './views/ReviewWorkspace';

import { Project, AuditReport, Rule, ReviewType, Severity, Issue } from './types';
import { initialProjects, initialRules, prebakedReviews } from './mockData';
import { GeminiProvider, ClaudeProvider, ChatGPTProvider } from './lib/providers';

// Custom premium easing curve for silky smooth, fluid deceleration (easeOutExpo)
const EASE_CUSTOM = [0.16, 1, 0.3, 1];

export default function App() {
  const [workflowState, setWorkflowState] = useState<'landing' | 'diagnosing' | 'review'>('landing');
  const [diagnosingFile, setDiagnosingFile] = useState<{ url: string; name: string } | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  // App core persistent states
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [reviews, setReviews] = useState<AuditReport[]>(prebakedReviews);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>('proj_fintech');
  const [activeReport, setActiveReport] = useState<AuditReport | null>(null);
  
  // AI Provider configuration
  const [activeProvider, setActiveProvider] = useState<string>('gemini');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditMessage, setAuditMessage] = useState<string>('');

  const handleSelectDemo = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (rev) {
      setDiagnosingFile({ url: rev.imageUrl, name: rev.name });
      setSelectedDemoId(reviewId);
      setWorkflowState('diagnosing');
    }
  };

  const handleUploadImage = (fileDataUrl: string, fileName: string) => {
    setDiagnosingFile({ url: fileDataUrl, name: fileName });
    setSelectedDemoId(null);
    setWorkflowState('diagnosing');
  };

  const handleDiagnosingComplete = (report: AuditReport | null, error?: string) => {
    if (selectedDemoId) {
      const rev = reviews.find(r => r.id === selectedDemoId);
      if (rev) {
        setActiveReport(rev);
        setActiveProjectId(rev.projectId);
      }
    } else if (report) {
      setReviews(prev => [report, ...prev]);
      setActiveReport(report);
    }
    setWorkflowState('review');
  };

  // Runs active review calling the isolated Provider layer
  const handleRunAudit = async (type: ReviewType, customPrompt?: string) => {
    if (!activeReport) return;

    setIsAuditing(true);
    setAuditMessage(`Invoking ${activeProvider.toUpperCase()} vision model core. Enforcing UX guidelines...`);

    try {
      let provider;
      if (activeProvider === 'claude') provider = new ClaudeProvider();
      else if (activeProvider === 'chatgpt') provider = new ChatGPTProvider();
      else provider = new GeminiProvider();

      const result = await provider.analyzeDesign(
        activeReport.imageUrl,
        rules,
        type,
        customPrompt
      );

      const updatedReport: AuditReport = {
        ...activeReport,
        score: result.score || 0,
        severity: result.severity || Severity.MEDIUM,
        summary: result.summary || 'Audit executed successfully.',
        issues: (result.issues || []).map((iss: any, idx: number) => ({
          id: iss.id || `iss_${Math.random().toString(36).substr(2, 6)}_${idx}`,
          ...iss
        })),
        recommendations: result.recommendations || [],
        reviewType: type,
        createdAt: new Date().toISOString(),
        visualObservationSummary: (result as any).visualObservationSummary,
        isUnavailable: (result as any).isUnavailable || false
      };

      setReviews(prev => prev.map(r => r.id === activeReport.id ? updatedReport : r));
      setActiveReport(updatedReport);
    } catch (err) {
      console.error(err);
      // Under the new strategy: NEVER FABRICATE FINDINGS, show unavailable
      const updatedReport: AuditReport = {
        ...activeReport,
        score: 0,
        severity: Severity.INFO,
        summary: 'AI Review Temporarily Unavailable. The uploaded screen was received successfully, but the AI analysis service could not complete the review at this time.',
        issues: [],
        recommendations: [],
        reviewType: type,
        createdAt: new Date().toISOString(),
        isUnavailable: true
      };
      setReviews(prev => prev.map(r => r.id === activeReport.id ? updatedReport : r));
      setActiveReport(updatedReport);
    } finally {
      setIsAuditing(false);
    }
  };

  // Appends a manually placed pin annotation
  const handleAddCustomIssue = (issue: Omit<Issue, 'id'>) => {
    if (!activeReport) return;

    const newIssue: Issue = {
      ...issue,
      id: `iss_custom_${Math.random().toString(36).substr(2, 6)}`
    };

    const penalty = issue.severity === 'high' ? 6 : (issue.severity === 'medium' ? 3 : 1.5);
    const newScore = Math.max(30, Math.min(100, activeReport.score - Math.round(penalty)));

    const updatedReport: AuditReport = {
      ...activeReport,
      score: newScore,
      issues: [...activeReport.issues, newIssue],
      summary: `Manual canvas annotations updated. I have analyzed your custom coordinates and adjusted the overall UX index rating to ${newScore}/100.`
    };

    setReviews(prev => prev.map(r => r.id === activeReport.id ? updatedReport : r));
    setActiveReport(updatedReport);
  };

  // Reset core storage
  const handleResetData = () => {
    setProjects(initialProjects);
    setReviews(prebakedReviews);
    setRules(initialRules);
    setActiveProjectId('proj_fintech');
    setActiveReport(null);
    setWorkflowState('landing');
  };

  const handleToggleRule = (key: string) => {
    setRules(prev => prev.map(r => r.key === key ? { ...r, enabled: !r.enabled } : r));
  };

  const handleUpdateWeight = (key: string, weight: number) => {
    setRules(prev => prev.map(r => r.key === key ? { ...r, weight } : r));
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#02040c] via-[#040c24] to-[#00458e] flex flex-col overflow-hidden font-sans text-slate-200 relative select-none">
      
      {/* Dynamic Glowing Spotlight - Bottom Right Corner */}
      <div 
        className="absolute bottom-0 right-0 w-[1000px] h-[800px] pointer-events-none z-0 translate-x-1/4 translate-y-1/4"
        style={{
          background: 'radial-gradient(circle 500px at center, rgba(37, 99, 235, 0.42) 0%, rgba(29, 78, 216, 0.18) 50%, transparent 100%)',
          filter: 'blur(90px)'
        }}
      />
      {/* Extra soft blue glow for smooth color blending */}
      <div 
        className="absolute bottom-0 right-0 w-[600px] h-[500px] pointer-events-none z-0 translate-x-1/4 translate-y-1/4"
        style={{
          background: 'radial-gradient(circle 300px at center, rgba(59, 130, 246, 0.28) 0%, transparent 100%)',
          filter: 'blur(50px)'
        }}
      />

      {/* Concentric organic waves flowing from bottom-left corner */}
      <svg className="absolute bottom-0 left-0 w-[700px] h-[500px] pointer-events-none opacity-[0.22] z-0" viewBox="0 0 700 500" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={`bl-1-${i}`}
            d={`M -50,${180 + i * 22} C ${140 + i * 12},${320 - i * 8} ${240 + i * 18},${420 - i * 4} ${480 + i * 12},550`}
            stroke="rgba(37, 99, 235, 0.65)"
            strokeWidth="0.75"
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <path
            key={`bl-2-${i}`}
            d={`M -50,${140 + i * 26} C ${170 + i * 14},${280 - i * 6} ${270 + i * 22},${450 - i * 2} ${580 + i * 10},550`}
            stroke="rgba(59, 130, 246, 0.35)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Ribbon wavy lines curving upwards from bottom-right corner */}
      <svg className="absolute bottom-0 right-0 w-[850px] h-[650px] pointer-events-none opacity-[0.25] z-0" viewBox="0 0 850 650" fill="none">
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={`br-1-${i}`}
            d={`M ${480 - i * 12},700 C ${540 - i * 6},${320 + i * 12} ${740 - i * 16},${220 + i * 6} 920,${120 + i * 22}`}
            stroke="rgba(37, 99, 235, 0.6)"
            strokeWidth="0.75"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={`br-2-${i}`}
            d={`M ${380 - i * 16},700 C ${480 - i * 10},${280 + i * 14} ${680 - i * 22},${180 + i * 8} 980,${80 + i * 26}`}
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Main Panel Content Routing */}
      <main className="flex-1 flex flex-col z-10 relative overflow-hidden min-h-0 h-full min-w-0">
        
        {/* Animated Custom Handshake vision Loader */}
        {isAuditing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 p-8 rounded-3xl w-full max-w-sm border border-indigo-500/20 shadow-2xl space-y-4 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
              <div>
                <h3 className="text-sm font-display font-semibold text-white uppercase tracking-wider animate-pulse">Critiq Analysis Core</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1.5 leading-normal">{auditMessage}</p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {workflowState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE_CUSTOM }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              <Landing
                onUploadImage={handleUploadImage}
                onSelectDemo={handleSelectDemo}
                onResetData={handleResetData}
              />
            </motion.div>
          )}

          {workflowState === 'diagnosing' && (
            <motion.div
              key="diagnosing"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: EASE_CUSTOM }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              <Diagnosing
                fileName={diagnosingFile?.name || 'uploaded_layout.png'}
                imageSrc={diagnosingFile?.url || ''}
                rules={rules}
                reviewType={ReviewType.FULL_AUDIT}
                onComplete={handleDiagnosingComplete}
              />
            </motion.div>
          )}

          {workflowState === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: EASE_CUSTOM }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              <ReviewWorkspace
                project={projects.find(p => p.id === activeProjectId) || null}
                rules={rules}
                activeReport={activeReport}
                activeProvider={activeProvider}
                onSelectProvider={setActiveProvider}
                onToggleRule={handleToggleRule}
                onUpdateWeight={handleUpdateWeight}
                onRunAudit={handleRunAudit}
                onAddCustomIssue={handleAddCustomIssue}
                onCloseWorkspace={() => {
                  setActiveReport(null);
                  setWorkflowState('landing');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
