/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeightProfile {
  accessibility: number;
  usability: number;
  visualDesign: number;
  interaction: number;
  designSystem: number;
  enterpriseUX: number;
  mobileUX: number;
  performance: number;
  conversion: number;
  content: number;
  navigation: number;
}

export interface AuditThresholds {
  contrastThreshold: number;
  minTouchTargetSize: number;
  strictGridRules: boolean;
  minFontSize: number;
  responsiveBreakpointChecks: boolean;
  colorBlindValidation: boolean;
  typographyScaleValidation: boolean;
  spacingTolerance: number;
  interactionDelayThreshold: number;
}

export interface ReviewMethodology {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name, e.g. "Sparkles", "Eye", "Compass"
  focusAreas: string[];
  weightProfile: WeightProfile;
  recommendedFor: string;
  estimatedDuration: string; // e.g. "45–60 seconds"
  analysisDepth: 'quick' | 'standard' | 'comprehensive';
  defaultConfiguration: AuditThresholds;
  enabled: boolean;
}

export interface AdvancedOptionsState {
  experimentalRules: boolean;
  deepAnalysisMode: boolean;
  strictAccessibilityMode: boolean;
  performanceOptimizations: boolean;
  customJsonOutput: boolean;
  verboseReasoning: boolean;
  developerDiagnostics: boolean;
  providerDebugInfo: boolean;
}

export interface ReviewConfigurationState {
  selectedMethodologyId: string;
  selectedProviderId: string;
  thresholds: AuditThresholds;
  advancedOptions: AdvancedOptionsState;
}
