/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue, DesignHealth, IssueSeverity, ScoreDetail } from './types';

export class DesignHealthEngine {
  /**
   * Calculate Design Health scores entirely from verified issues
   */
  public static calculate(issues: CritiqIssue[], averageConfidence: number): DesignHealth {
    // 1. Initialize all categories with 100 baseline
    let uxBase = 100;
    let uiBase = 100;
    let accessibilityBase = 100;
    let visualBase = 100;
    let interactionBase = 100;
    let contentBase = 100;
    let mobileBase = 100;
    let enterpriseBase = 100;

    // 2. Map severity deduction weights
    const getDeduction = (severity: IssueSeverity): number => {
      switch (severity) {
        case IssueSeverity.CRITICAL: return 18;
        case IssueSeverity.HIGH: return 12;
        case IssueSeverity.MEDIUM: return 7;
        case IssueSeverity.LOW: return 3;
        default: return 1;
      }
    };

    // 3. Deduct scores per issue matching their thematic markers
    issues.forEach(issue => {
      const deduction = getDeduction(issue.severity);
      const text = `${issue.title} ${issue.description} ${issue.category} ${issue.uxPrinciple} ${issue.accessibilityGuideline}`.toLowerCase();

      // UX Health
      if (
        text.includes('ux') || text.includes('usability') || text.includes('heuristic') ||
        text.includes('navigation') || text.includes('friction') || text.includes('flow')
      ) {
        uxBase -= deduction;
      }

      // UI Health
      if (
        text.includes('ui') || text.includes('design system') || text.includes('grid') ||
        text.includes('align') || text.includes('spacing') || text.includes('layout')
      ) {
        uiBase -= deduction;
      }

      // Accessibility
      if (
        text.includes('access') || text.includes('wcag') || text.includes('contrast') ||
        text.includes('touch target') || text.includes('screen reader') || text.includes('a11y')
      ) {
        accessibilityBase -= deduction;
      }

      // Visual Design
      if (
        text.includes('visual') || text.includes('hierarchy') || text.includes('color') ||
        text.includes('typography') || text.includes('font') || text.includes('symmetry')
      ) {
        visualBase -= deduction;
      }

      // Interaction
      if (
        text.includes('interact') || text.includes('button') || text.includes('cta') ||
        text.includes('click') || text.includes('hover') || text.includes('gesture')
      ) {
        interactionBase -= deduction;
      }

      // Content
      if (
        text.includes('content') || text.includes('text') || text.includes('copy') ||
        text.includes('label') || text.includes('microcopy') || text.includes('form')
      ) {
        contentBase -= deduction;
      }

      // Mobile UX
      if (
        text.includes('mobile') || text.includes('responsive') || text.includes('thumb') ||
        text.includes('touch') || text.includes('reach') || text.includes('viewport')
      ) {
        mobileBase -= deduction;
      }

      // Enterprise Readiness
      if (
        text.includes('enterprise') || text.includes('scale') || text.includes('table') ||
        text.includes('data') || text.includes('density') || text.includes('complexity')
      ) {
        enterpriseBase -= deduction;
      }
    });

    // 4. Clamp helper (minimum 30, maximum 100)
    const clamp = (val: number): number => Math.max(30, Math.min(100, val));

    const uxVal = clamp(uxBase);
    const uiVal = clamp(uiBase);
    const a11yVal = clamp(accessibilityBase);
    const visualVal = clamp(visualBase);
    const interactionVal = clamp(interactionBase);
    const contentVal = clamp(contentBase);
    const mobileVal = clamp(mobileBase);
    const enterpriseVal = clamp(enterpriseBase);

    // 5. Generate descriptive explanation paragraphs for why the score is what it is
    const explainUX = (score: number): string => {
      if (score === 100) return 'Perfect score. Layout structure, user flow sequence, and interaction steps follow clean mental models with minimal cognitive friction.';
      if (score >= 80) return 'Strong usability posture. Main interactive routes and navigation paths are distinct, though minor refinement could ease workflow progression.';
      return `Usability is impacted. Several structural blockers or convoluted reading sequences elevate cognitive load, slowing down primary user tasks.`;
    };

    const explainUI = (score: number): string => {
      if (score === 100) return 'Complete alignment. Grid intervals, element containers, and system components adhere to spacing proportions cleanly.';
      if (score >= 80) return 'Consistent interface structure. Elements are clearly anchored and components follow general design system rules with few alignment issues.';
      return `Interface anomalies observed. Sizable grid, container, or component spacing deviations undermine the overall visual symmetry and design cohesion.`;
    };

    const explainA11y = (score: number): string => {
      if (score === 100) return 'Highly accessible. Element color contrasts, touch targets, and visual separation meet standard WCAG compliance standards.';
      if (score >= 80) return 'Good accessibility standard. The screen is legible and most touch targets are reachable, with only minor compliance deviations.';
      return `Critical accessibility barriers. Substandard contrast ratios or undersized tap targets make elements difficult to perceive or trigger comfortably.`;
    };

    const explainVisual = (score: number): string => {
      if (score === 100) return 'Perfect layout hierarchy. Typography styles, color palettes, and weight relationships direct visual focus optimally.';
      if (score >= 80) return 'Clear visual structure. Prominent headers and clear calls-to-action organize the screen, with minor font/color contrast items.';
      return `Visual hierarchy needs structure. Unfocused color choices or poorly scaled typography dilute reading priority, leading to scanning fatigue.`;
    };

    const explainInteraction = (score: number): string => {
      if (score === 100) return 'Highly responsive interaction models. Action triggers, clickable states, and buttons communicate active affordances instantly.';
      if (score >= 80) return 'Predictable interactions. Main actions are clear, but button hierarchy could be refined to prevent primary and secondary confusion.';
      return `Interaction friction present. Ambiguous CTA affordances, overlapping click-boundaries, or lack of tactile feedback increase transaction hesitation.`;
    };

    const explainContent = (score: number): string => {
      if (score === 100) return 'Pristine copy legibility. Labels, inputs, instruction texts, and headers are clear, concise, and logically positioned.';
      if (score >= 80) return 'Clear information copy. Structural headers and labels explain fields appropriately, with minor microcopy tuning opportunities.';
      return `Content layout issues. Poorly structured text density, missing form placeholder context, or confusing instruction copy causes user scanning friction.`;
    };

    const explainMobile = (score: number): string => {
      if (score === 100) return 'Fully responsive mobile layout. Safe thumb Zones, fluid margins, and vertical stacking conform perfectly to compact viewports.';
      if (score >= 80) return 'Responsive layout setup. Components stack well on mobile screens, requiring only minor tap-target or gutter spacing adjustments.';
      return `Poor mobile adaptation. Asymmetric spacing, squeezed column columns, or uncomfortably small mobile tap areas degrade small-screen usability.`;
    };

    const explainEnterprise = (score: number): string => {
      if (score === 100) return 'Enterprise-ready dashboard layout. High information density is supported by clean structural wrappers and grids.';
      if (score >= 80) return 'Good enterprise structure. Manages nested tables, forms, and secondary widgets with proper spacing rules.';
      return `Low enterprise utility. Complex charts, data views, or table systems lack the alignment, gutters, and density guidelines to scale.`;
    };

    // 6. Overall Design Health is the average of categories
    const overallScore = Math.round(
      (uxVal + uiVal + a11yVal + visualVal + interactionVal + contentVal + mobileVal + enterpriseVal) / 8
    );

    const overallExplanation = (score: number): string => {
      if (score >= 90) return 'Excellent. The screen presents an exceptionally polished and highly accessible interface, following refined UX/UI guidelines.';
      if (score >= 75) return 'Good visual quality. Minimal layout alignments and spacing adjustments will bring the screen to pristine design system production standards.';
      return 'Action required. Multiple high-severity visual defects and usability barriers are present, disrupting the user experience and requiring immediate resolution.';
    };

    return {
      overallDesignHealth: {
        score: clamp(overallScore),
        explanation: overallExplanation(overallScore)
      },
      uxHealth: { score: uxVal, explanation: explainUX(uxVal) },
      uiHealth: { score: uiVal, explanation: explainUI(uiVal) },
      accessibilityHealth: { score: a11yVal, explanation: explainA11y(a11yVal) },
      visualDesignHealth: { score: visualVal, explanation: explainVisual(visualVal) },
      interactionHealth: { score: interactionVal, explanation: explainInteraction(interactionVal) },
      contentHealth: { score: contentVal, explanation: explainContent(contentVal) },
      mobileHealth: { score: mobileVal, explanation: explainMobile(mobileVal) },
      enterpriseReadiness: { score: enterpriseVal, explanation: explainEnterprise(enterpriseVal) },
      confidenceScore: {
        score: clamp(Math.round(averageConfidence)),
        explanation: `Calculated mean certainty score across all active Multi-Agent layout inspectors (representing highly confident heuristic detections).`
      }
    };
  }
}
