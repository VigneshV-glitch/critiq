/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewMethodology } from './types';
import {
  COMPREHENSIVE_WEIGHTS,
  WCAG_ACCESSIBILITY_WEIGHTS,
  NIELSEN_USABILITY_WEIGHTS,
  ENTERPRISE_UX_WEIGHTS,
  MOBILE_UX_WEIGHTS,
  DESIGN_SYSTEM_WEIGHTS,
} from './WeightProfile';

const DEFAULT_THRESHOLDS = {
  contrastThreshold: 4.5,
  minTouchTargetSize: 44,
  strictGridRules: true,
  minFontSize: 12,
  responsiveBreakpointChecks: true,
  colorBlindValidation: false,
  typographyScaleValidation: true,
  spacingTolerance: 4, // in px
  interactionDelayThreshold: 200, // in ms
};

export const METHODOLOGIES: ReviewMethodology[] = [
  {
    id: 'comprehensive-critiq',
    name: 'Comprehensive Critiq Review ⭐',
    description: 'A complete end-to-end design inspection across all five major design system and usability dimensions.',
    icon: 'Sparkles',
    focusAreas: ['Accessibility', 'Usability', 'Visual Design', 'Interaction', 'Enterprise UX'],
    weightProfile: COMPREHENSIVE_WEIGHTS,
    recommendedFor: 'Complete audits, production-ready sign-offs, and competitive product analysis.',
    estimatedDuration: '45–60 seconds',
    analysisDepth: 'comprehensive',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      contrastThreshold: 4.5,
      minTouchTargetSize: 44,
      strictGridRules: true,
    },
    enabled: true,
  },
  {
    id: 'wcag-accessibility',
    name: 'WCAG Accessibility Review',
    description: 'Strict evaluation of accessibility barriers, focus flow logic, and screen readability protocols.',
    icon: 'Eye',
    focusAreas: ['Accessibility', 'Contrast', 'Touch Targets', 'Keyboard', 'Screen Readers'],
    weightProfile: WCAG_ACCESSIBILITY_WEIGHTS,
    recommendedFor: 'SaaS compliance checks, government design standards, and broad public-facing utilities.',
    estimatedDuration: '25–35 seconds',
    analysisDepth: 'standard',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      contrastThreshold: 7.0, // WCAG AAA Strict default
      minTouchTargetSize: 48, // Higher target for accessibility
      strictGridRules: false,
      colorBlindValidation: true,
    },
    enabled: true,
  },
  {
    id: 'nielsen-usability',
    name: 'Nielsen Usability Review',
    description: 'Heuristic alignment review focusing on user control, navigation logic, and task execution friction.',
    icon: 'Compass',
    focusAreas: ['Usability', 'Task Flow', 'Mental Models', 'Consistency', 'Recognition'],
    weightProfile: NIELSEN_USABILITY_WEIGHTS,
    recommendedFor: 'Early wireframes, high-fidelity prototypes, and customer journey validation.',
    estimatedDuration: '25–35 seconds',
    analysisDepth: 'standard',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      strictGridRules: false,
      interactionDelayThreshold: 100,
    },
    enabled: true,
  },
  {
    id: 'enterprise-ux',
    name: 'Enterprise UX Review',
    description: 'High-density visual layout auditing optimized for dashboards, data heavy panels, and business efficiency.',
    icon: 'Layout',
    focusAreas: ['Dashboards', 'Data Density', 'Efficiency', 'Power Users'],
    weightProfile: ENTERPRISE_UX_WEIGHTS,
    recommendedFor: 'B2B consoles, analytic portals, spreadsheets, and complex internal tooling.',
    estimatedDuration: '45–60 seconds',
    analysisDepth: 'comprehensive',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      strictGridRules: true,
      minFontSize: 11, // Smaller for high data density
      spacingTolerance: 2,
    },
    enabled: true,
  },
  {
    id: 'mobile-ux',
    name: 'Mobile UX Review',
    description: 'Small viewport touch target, ergonomics, and vertical containment layout compliance.',
    icon: 'Smartphone',
    focusAreas: ['Touch', 'Navigation', 'Safe Areas', 'Responsive Design'],
    weightProfile: MOBILE_UX_WEIGHTS,
    recommendedFor: 'Native application layouts, mobile web components, and touch-screen devices.',
    estimatedDuration: '15–20 seconds',
    analysisDepth: 'quick',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      minTouchTargetSize: 44,
      responsiveBreakpointChecks: true,
      spacingTolerance: 8,
    },
    enabled: true,
  },
  {
    id: 'design-system',
    name: 'Design System Review',
    description: 'Pixel-perfect spacing, typography scaling, component consistency, and grid geometry validation.',
    icon: 'Sliders',
    focusAreas: ['Consistency', 'Components', 'Spacing', 'Typography', 'Visual Tokens'],
    weightProfile: DESIGN_SYSTEM_WEIGHTS,
    recommendedFor: 'Brand alignment checks, UI kit component exports, and Figma design token hand-offs.',
    estimatedDuration: '25–35 seconds',
    analysisDepth: 'standard',
    defaultConfiguration: {
      ...DEFAULT_THRESHOLDS,
      strictGridRules: true,
      spacingTolerance: 4,
      typographyScaleValidation: true,
    },
    enabled: true,
  },
];

/**
 * Registry class to allow dynamic loading/registration of extra review methodologies (healthcare, ecommerce, etc.)
 */
export class MethodologyRegistry {
  private static registry: ReviewMethodology[] = [...METHODOLOGIES];

  public static register(methodology: ReviewMethodology) {
    if (this.registry.some((m) => m.id === methodology.id)) {
      console.warn(`Methodology with ID ${methodology.id} is already registered.`);
      return;
    }
    this.registry.push(methodology);
  }

  public static getAll(): ReviewMethodology[] {
    return this.registry;
  }

  public static getById(id: string): ReviewMethodology | undefined {
    return this.registry.find((m) => m.id === id);
  }
}
