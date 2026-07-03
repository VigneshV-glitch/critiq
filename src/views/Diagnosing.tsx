/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader, Terminal, Sparkles, Cpu, Layers, Maximize } from 'lucide-react';
import { motion } from 'motion/react';
import { Rule, ReviewType, AuditReport, Severity } from '../types';

interface DiagnosingProps {
  onComplete: (report: AuditReport | null, error?: string) => void;
  fileName?: string;
  imageSrc: string;
  rules: Rule[];
  reviewType: ReviewType;
}

interface Step {
  id: number;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

export default function Diagnosing({
  onComplete,
  fileName = 'uploaded_layout.png',
  imageSrc,
  rules,
  reviewType,
}: DiagnosingProps) {
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [consoleLog, setConsoleLog] = useState<string>('Booting Critiq vision engine...');
  const [apiReport, setApiReport] = useState<AuditReport | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const isResolvedRef = useRef(false);

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Extracting Components', status: 'pending' },
    { id: 2, label: 'Detecting Layout Structure', status: 'pending' },
    { id: 3, label: 'Evaluating Accessibility', status: 'pending' },
    { id: 4, label: 'Running Usability Review', status: 'pending' },
    { id: 5, label: 'Measuring Consistency', status: 'pending' },
    { id: 6, label: 'Generating Recommendations', status: 'pending' },
    { id: 7, label: 'Calculating Score', status: 'pending' }
  ]);

  const liveLogs = [
    'Handshaking with multithreaded layout matrices...',
    'Locating boundary bounding boxes & visual overlays...',
    'Running color contrast analysis against WCAG AA parameters...',
    'Evaluating absolute and relative coordinates on elements...',
    'Checking layout alignment grids & nested spacing systems...',
    'Interpreting interactive controls and cognitive choice scales...',
    'Compiling diagnostic scoring matrices and rules violations...',
    'Drafting final expert recommendations and heuristic insights...'
  ];

  // 1. Trigger the actual API call on mount
  useEffect(() => {
    let active = true;

    async function fetchAnalysis() {
      try {
        const response = await fetch('/api/critiq/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageSrc,
            rules,
            reviewType,
            fileName,
          })
        });

        const data = await response.json();
        
        if (!active) return;

        if (data.isUnavailable || data.error) {
          setApiError(data.message || 'AI Review Temporarily Unavailable');
          setApiReport({
            id: `rev_fail_${Math.random().toString(36).substr(2, 6)}`,
            projectId: 'proj_fintech',
            name: fileName.split('.')[0] || 'Uploaded Wireframe',
            imageUrl: imageSrc,
            reviewType: reviewType,
            score: 0,
            severity: Severity.INFO,
            summary: data.message || 'AI Review Temporarily Unavailable. The uploaded screen was received successfully, but the AI analysis service could not complete the review at this time.',
            issues: [],
            recommendations: [],
            createdAt: new Date().toISOString(),
            isUnavailable: true
          });
        } else {
          setApiReport({
            id: `rev_${Math.random().toString(36).substr(2, 6)}`,
            projectId: 'proj_fintech',
            name: fileName.split('.')[0] || 'Uploaded Wireframe',
            imageUrl: imageSrc,
            reviewType: reviewType,
            score: data.score || 85,
            severity: data.severity || Severity.MEDIUM,
            summary: data.summary || 'Audit completed successfully.',
            issues: (data.issues || []).map((iss: any, idx: number) => ({
              id: iss.id || `iss_${Math.random().toString(36).substr(2, 6)}_${idx}`,
              ...iss
            })),
            recommendations: data.recommendations || [],
            createdAt: new Date().toISOString(),
            visualObservationSummary: data.visualObservationSummary,
            screenModel: data.screenModel,
            isUnavailable: false
          });
        }
      } catch (err: any) {
        if (!active) return;
        console.error('Failed fetching analysis in Diagnosing view:', err);
        setApiError(err.message || 'Network request failed.');
        setApiReport({
          id: `rev_fail_${Math.random().toString(36).substr(2, 6)}`,
          projectId: 'proj_fintech',
          name: fileName.split('.')[0] || 'Uploaded Wireframe',
          imageUrl: imageSrc,
          reviewType: reviewType,
          score: 0,
          severity: Severity.INFO,
          summary: 'AI Review Temporarily Unavailable. The uploaded screen was received successfully, but the AI analysis service could not complete the review at this time.',
          issues: [],
          recommendations: [],
          createdAt: new Date().toISOString(),
          isUnavailable: true
        });
      } finally {
        isResolvedRef.current = true;
      }
    }

    fetchAnalysis();

    return () => {
      active = false;
    };
  }, [imageSrc, rules, reviewType, fileName]);

  // 2. Animate the checklist steps and progress percentage progressively
  useEffect(() => {
    // We have 7 steps. Let's cycle through them.
    const stepDuration = 600; // ms per step
    
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        
        // Mark previous steps as completed, current as processing
        setSteps(prevSteps => 
          prevSteps.map((step, idx) => {
            if (idx < prevIndex) return { ...step, status: 'completed' };
            if (idx === prevIndex) return { ...step, status: 'processing' };
            return step;
          })
        );

        if (prevIndex < liveLogs.length) {
          setConsoleLog(liveLogs[prevIndex]);
        }

        if (nextIndex >= steps.length) {
          clearInterval(stepInterval);
        }
        return nextIndex;
      });
    }, stepDuration);

    // Fine-grained percentage updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          // If we are at 98% but API is not yet completed, stay at 98%
          if (!isResolvedRef.current) {
            return 98;
          }
          // If API is completed, we will transition instantly to 100% in the monitor effect
          return 98;
        }
        return prev + 1;
      });
    }, 45); // Takes around 4.5 seconds to hit 98%

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  // 3. Monitor both API completion and progress
  useEffect(() => {
    const checkCompletionInterval = setInterval(() => {
      if (isResolvedRef.current && apiReport) {
        clearInterval(checkCompletionInterval);
        
        // Fast-forward UI to completed state
        setProgress(100);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setConsoleLog('Finalizing visual feedback report...');

        // Transition out
        const finalDelay = setTimeout(() => {
          onComplete(apiReport, apiError || undefined);
        }, 800);

        return () => clearTimeout(finalDelay);
      }
    }, 100);

    return () => clearInterval(checkCompletionInterval);
  }, [apiReport, apiError, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative min-h-0 select-none">
      
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

      <div className="w-full max-w-xl text-center space-y-10 z-10">
        
        {/* Glowing circular loader & progress readout */}
        <div className="space-y-4">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-white/5"
                strokeWidth="4"
                fill="transparent"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-indigo-500"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - progress / 100) }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              />
            </svg>

            {/* Glowing Inner Ring */}
            <div className="absolute w-20 h-20 rounded-full bg-indigo-950/45 border border-indigo-500/20 shadow-xl shadow-indigo-950/60 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-extrabold text-white">{progress}%</span>
              <span className="text-[8px] font-mono font-bold tracking-widest text-indigo-300 uppercase mt-0.5 animate-pulse">Analysing</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Target: {fileName}</span>
            <h3 className="text-lg font-display font-medium text-white tracking-wide">Executing Heuristics Scan</h3>
          </div>
        </div>

        {/* Diagnostic Progressive Step Indicators */}
        <div className="bg-white/2 border border-white/5 rounded-2xl p-5 text-left space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Analysis Pipelines</span>
            <span className="text-[10px] font-mono font-bold text-indigo-400">
              {steps.filter(s => s.status === 'completed').length} / {steps.length} Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {steps.map((step, idx) => {
              const isProcessing = step.status === 'processing';
              const isCompleted = step.status === 'completed';

              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${
                    isProcessing 
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-white' 
                      : isCompleted 
                        ? 'bg-white/[0.01] border-transparent text-indigo-200' 
                        : 'bg-transparent border-transparent text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                    isCompleted 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : isProcessing
                        ? 'bg-black/30 border-indigo-500/50 text-indigo-400'
                        : 'bg-black/20 border-white/5 text-slate-700'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : isProcessing ? (
                      <div className="w-2.5 h-2.5 rounded-full border border-indigo-400 border-t-transparent animate-spin"></div>
                    ) : (
                      <span className="text-[9px] font-mono font-bold">{step.id}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium tracking-wide ${isProcessing ? 'text-indigo-200 font-semibold' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulating live terminal node outputs */}
        <div className="p-3 bg-black/45 rounded-xl border border-white/5 flex items-center gap-2 max-w-sm mx-auto text-left">
          <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-mono text-[10px] text-slate-400 truncate leading-none">
            {consoleLog}
          </span>
        </div>

      </div>
    </div>
  );
}
