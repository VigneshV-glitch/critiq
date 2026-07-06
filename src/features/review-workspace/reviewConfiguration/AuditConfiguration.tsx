/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RotateCcw, HelpCircle, ChevronDown, ChevronUp, ShieldAlert, Sliders, Eye, Zap } from 'lucide-react';
import { useMethodologyStore, methodologyActions } from './MethodologyStore';
import { MethodologyRegistry } from './ReviewMethodology';
import { motion, AnimatePresence } from 'motion/react';

interface ThresholdItemProps {
  label: string;
  currentValue: any;
  recommendedValue: string;
  description: string;
  onReset: () => void;
  children: React.ReactNode;
}

function ThresholdItem({ label, currentValue, recommendedValue, description, onReset, children }: ThresholdItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-[#0b0c12]/70 border border-white/5 hover:border-white/10 rounded-xl p-4.5 transition-all flex flex-col justify-between space-y-3.5 relative">
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h5 className="text-xs font-semibold text-slate-200 truncate">{label}</h5>
          
          {/* Info Tooltip */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-0.5 text-slate-500 hover:text-indigo-400 rounded-md transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#141622] border border-white/10 rounded-lg p-2 shadow-xl z-50 text-xs text-slate-300 font-normal leading-relaxed text-center pointer-events-none"
                >
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#141622]" />
                  {description}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={onReset}
          title="Reset to methodology default"
          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Control Input */}
      <div className="w-full">
        {children}
      </div>

      {/* Value Summary (Condensed representation) */}
      <div className="flex items-center justify-between text-xs font-mono border-t border-white/3 pt-2">
        <span className="text-slate-500">
          Rec: <span className="text-emerald-400 font-medium">{recommendedValue}</span>
        </span>
        <span className="text-slate-400">
          Val: <span className="text-indigo-400 font-bold">{currentValue}</span>
        </span>
      </div>
    </div>
  );
}

export default function AuditConfiguration() {
  const { thresholds, selectedMethodologyId } = useMethodologyStore();

  // Accordion open/close states
  const [openSection, setOpenSection] = useState<'a11y' | 'layout' | 'interaction' | null>('a11y');

  const handleReset = (key: keyof typeof thresholds) => {
    const defaultMethodology = MethodologyRegistry.getById(selectedMethodologyId);
    if (defaultMethodology) {
      methodologyActions.updateThresholds({
        [key]: defaultMethodology.defaultConfiguration[key],
      });
    }
  };

  const handleRestoreDefaults = () => {
    methodologyActions.resetThresholds();
  };

  const toggleSection = (section: 'a11y' | 'layout' | 'interaction') => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-5">
      {/* Sub-header section with action */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-white/5">
        <div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Custom parameters defined by the selected review model. Fine-tune constraints below or restore active methodology profile baselines.
          </p>
        </div>
        <button
          onClick={handleRestoreDefaults}
          className="text-xs font-mono font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/2 hover:bg-white/5 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          Restore Methodology Defaults
        </button>
      </div>

      {/* Segmented Accordions */}
      <div className="space-y-3">
        
        {/* Category 1: Accessibility & Typography */}
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#07080c]/40 transition-all">
          <button
            onClick={() => toggleSection('a11y')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/2 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">Category A</span>
                <h4 className="text-xs font-semibold text-white">Accessibility & Typography ({
                  [
                    thresholds.contrastThreshold,
                    thresholds.minTouchTargetSize,
                    thresholds.colorBlindValidation,
                    thresholds.minFontSize,
                    thresholds.typographyScaleValidation
                  ].filter(Boolean).length
                }/5 Configured)</h4>
              </div>
            </div>
            {openSection === 'a11y' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <AnimatePresence initial={false}>
            {openSection === 'a11y' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-[#0a0b10]/20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. WCAG Contrast Ratio */}
                  <ThresholdItem
                    label="WCAG Contrast Ratio"
                    currentValue={`${thresholds.contrastThreshold}:1`}
                    recommendedValue="4.5:1 (AA) or 7.0:1 (AAA)"
                    description="Luminosity difference standard between interactive text and background fills."
                    onReset={() => handleReset('contrastThreshold')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="12"
                        step="0.5"
                        value={thresholds.contrastThreshold}
                        onChange={(e) => methodologyActions.updateThresholds({ contrastThreshold: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </ThresholdItem>

                  {/* 2. Touch Target Size */}
                  <ThresholdItem
                    label="Touch Target Size (px)"
                    currentValue={`${thresholds.minTouchTargetSize}px`}
                    recommendedValue="44px (iOS) or 48px (Android)"
                    description="Minimum element layout bounds to guarantee flawless physical finger taps."
                    onReset={() => handleReset('minTouchTargetSize')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="24"
                        max="64"
                        step="2"
                        value={thresholds.minTouchTargetSize}
                        onChange={(e) => methodologyActions.updateThresholds({ minTouchTargetSize: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </ThresholdItem>

                  {/* 3. Color Blind Validation */}
                  <ThresholdItem
                    label="Color Blind Simulation"
                    currentValue={thresholds.colorBlindValidation ? 'Active' : 'Disabled'}
                    recommendedValue="Active"
                    description="Validates contrast blends under deuteranopia, protanopia, and tritanopia constraints."
                    onReset={() => handleReset('colorBlindValidation')}
                  >
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={thresholds.colorBlindValidation}
                        onChange={(e) => methodologyActions.updateThresholds({ colorBlindValidation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ml-2 text-xs font-medium text-slate-300">
                        {thresholds.colorBlindValidation ? 'Active Simulation' : 'Inactive'}
                      </span>
                    </label>
                  </ThresholdItem>

                  {/* 4. Minimum Font Size */}
                  <ThresholdItem
                    label="Minimum Font Size (px)"
                    currentValue={`${thresholds.minFontSize}px`}
                    recommendedValue="12px (Regular) or 10px (Subtext)"
                    description="Defines the floor boundary for microscopic elements to avoid readability fatigue."
                    onReset={() => handleReset('minFontSize')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="1"
                        value={thresholds.minFontSize}
                        onChange={(e) => methodologyActions.updateThresholds({ minFontSize: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </ThresholdItem>

                  {/* 5. Typography Scale Validation */}
                  <ThresholdItem
                    label="Type Hierarchy Scale"
                    currentValue={thresholds.typographyScaleValidation ? 'Enabled' : 'Disabled'}
                    recommendedValue="Enabled"
                    description="Fails when title-to-body font scale breaks proportional design-token step margins."
                    onReset={() => handleReset('typographyScaleValidation')}
                  >
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={thresholds.typographyScaleValidation}
                        onChange={(e) => methodologyActions.updateThresholds({ typographyScaleValidation: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ml-2 text-xs font-medium text-slate-300">
                        {thresholds.typographyScaleValidation ? 'Validate Progression' : 'Ignore Scale'}
                      </span>
                    </label>
                  </ThresholdItem>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category 2: Spacing & Layout */}
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#07080c]/40 transition-all">
          <button
            onClick={() => toggleSection('layout')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/2 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">Category B</span>
                <h4 className="text-xs font-semibold text-white">Spacing, Layout & Responsive Grid</h4>
              </div>
            </div>
            {openSection === 'layout' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <AnimatePresence initial={false}>
            {openSection === 'layout' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-[#0a0b10]/20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Spacing Tolerance */}
                  <ThresholdItem
                    label="Gutter Spacing Tolerance (px)"
                    currentValue={`${thresholds.spacingTolerance}px`}
                    recommendedValue="4px (Strict) or 8px (Comfortable)"
                    description="Acceptable alignment variance allowed before flagging pixel margins as off-grid."
                    onReset={() => handleReset('spacingTolerance')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="16"
                        step="1"
                        value={thresholds.spacingTolerance}
                        onChange={(e) => methodologyActions.updateThresholds({ spacingTolerance: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </ThresholdItem>

                  {/* 2. 8px Spacing Grid */}
                  <ThresholdItem
                    label="8px Grid Alignment"
                    currentValue={thresholds.strictGridRules ? 'Strict (8px/4px)' : 'Disabled'}
                    recommendedValue="Enforced"
                    description="Flags design systems with structural margins that do not multiply by geometric 8px/4px increments."
                    onReset={() => handleReset('strictGridRules')}
                  >
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={thresholds.strictGridRules}
                        onChange={(e) => methodologyActions.updateThresholds({ strictGridRules: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ml-2 text-xs font-medium text-slate-300">
                        {thresholds.strictGridRules ? 'Enforce 8px Grid' : 'Flexible'}
                      </span>
                    </label>
                  </ThresholdItem>

                  {/* 3. Responsive Breakpoints */}
                  <ThresholdItem
                    label="Breakpoint Alignment"
                    currentValue={thresholds.responsiveBreakpointChecks ? 'Enforced' : 'Unchecked'}
                    recommendedValue="Enforced"
                    description="Performs layout stress tests at boundary widths representing mobile, tablet, and widescreen."
                    onReset={() => handleReset('responsiveBreakpointChecks')}
                  >
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={thresholds.responsiveBreakpointChecks}
                        onChange={(e) => methodologyActions.updateThresholds({ responsiveBreakpointChecks: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ml-2 text-xs font-medium text-slate-300">
                        {thresholds.responsiveBreakpointChecks ? 'Enforce' : 'Unchecked'}
                      </span>
                    </label>
                  </ThresholdItem>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category 3: Interaction */}
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#07080c]/40 transition-all">
          <button
            onClick={() => toggleSection('interaction')}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/2 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">Category C</span>
                <h4 className="text-xs font-semibold text-white">Interaction & Kinetic Performance</h4>
              </div>
            </div>
            {openSection === 'interaction' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <AnimatePresence initial={false}>
            {openSection === 'interaction' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-[#0a0b10]/20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Interaction Delay */}
                  <ThresholdItem
                    label="Response Latency (ms)"
                    currentValue={`${thresholds.interactionDelayThreshold}ms`}
                    recommendedValue="100ms (Instantaneous) or 200ms"
                    description="Permitted animation or server transition latency constraint before kinetic lag is flagged."
                    onReset={() => handleReset('interactionDelayThreshold')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={thresholds.interactionDelayThreshold}
                        onChange={(e) => methodologyActions.updateThresholds({ interactionDelayThreshold: parseInt(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </ThresholdItem>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
