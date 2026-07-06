/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Beaker, Settings, Cpu, ShieldCheck, FileJson, FileText, Code2, HeartPulse } from 'lucide-react';
import { useMethodologyStore, methodologyActions } from './MethodologyStore';
import { motion, AnimatePresence } from 'motion/react';

interface AdvancedToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ComponentType<any>;
  description: string;
}

function AdvancedToggle({ label, checked, onChange, icon: Icon, description }: AdvancedToggleProps) {
  return (
    <div className="flex items-start gap-3.5 p-4 bg-[#0a0a0f] border border-white/3 hover:border-white/5 rounded-xl transition-all">
      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${checked ? 'bg-indigo-600/10 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200 truncate">{label}</span>
          <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AdvancedOptions() {
  const { advancedOptions } = useMethodologyStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/5 bg-[#08080c]/60 rounded-xl overflow-hidden transition-all duration-300">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/2 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-4.5 h-4.5 text-indigo-400" />
          <div>
            <h4 className="text-xs font-semibold text-white tracking-tight">Advanced Review Options</h4>
            <p className="text-xs text-slate-400 mt-0.5">Configure developer diagnostics, experimental rules, and output parameters.</p>
          </div>
        </div>
        <div className="p-1 rounded hover:bg-white/5 text-slate-400 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-5 bg-[#0a0b10]/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Experimental Rules */}
              <AdvancedToggle
                label="Experimental Rules"
                checked={advancedOptions.experimentalRules}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ experimentalRules: checked })}
                icon={Beaker}
                description="Enable bleeding-edge heuristics and pre-release WCAG contrast standards."
              />

              {/* 2. Deep Analysis Mode */}
              <AdvancedToggle
                label="Deep Analysis Mode"
                checked={advancedOptions.deepAnalysisMode}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ deepAnalysisMode: checked })}
                icon={Cpu}
                description="Increases agent processing budget for detailed sub-element mapping checks."
              />

              {/* 3. Strict Accessibility Mode */}
              <AdvancedToggle
                label="Strict Accessibility Mode"
                checked={advancedOptions.strictAccessibilityMode}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ strictAccessibilityMode: checked })}
                icon={ShieldCheck}
                description="Enforce absolute contrast margins (AAA) and fail on missing text alternatives."
              />

              {/* 4. Performance Optimizations */}
              <AdvancedToggle
                label="Performance Optimizations"
                checked={advancedOptions.performanceOptimizations}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ performanceOptimizations: checked })}
                icon={HeartPulse}
                description="Streamline token usage to minimize latency and speed up diagnostics by 25%."
              />

              {/* 5. Custom JSON Output */}
              <AdvancedToggle
                label="Custom JSON Output"
                checked={advancedOptions.customJsonOutput}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ customJsonOutput: checked })}
                icon={FileJson}
                description="Format audit findings into design-system ready standard JSON schema schemas."
              />

              {/* 6. Verbose Reasoning */}
              <AdvancedToggle
                label="Verbose Reasoning"
                checked={advancedOptions.verboseReasoning}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ verboseReasoning: checked })}
                icon={FileText}
                description="Forces inspectors to output chain-of-thought steps in problem descriptions."
              />

              {/* 7. Developer Diagnostics */}
              <AdvancedToggle
                label="Developer Diagnostics"
                checked={advancedOptions.developerDiagnostics}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ developerDiagnostics: checked })}
                icon={Code2}
                description="Attach raw DOM tree metadata maps to findings for visual debugging."
              />

              {/* 8. Provider Debug Information */}
              <AdvancedToggle
                label="Provider Debug Info"
                checked={advancedOptions.providerDebugInfo}
                onChange={(checked) => methodologyActions.updateAdvancedOptions({ providerDebugInfo: checked })}
                icon={Settings}
                description="Capture and stream HTTP header telemetry for active AI provider execution logs."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
