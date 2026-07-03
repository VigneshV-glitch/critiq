/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentIssue, CategoryScores } from './types';
import { Severity } from '../../types';

export class ScoringEngine {
  /**
   * Derive all design performance scores strictly from validated findings
   */
  public static calculate(issues: AgentIssue[]): CategoryScores {
    // 1. Start with a baseline of 100 for all scores
    let uxScore = 100;
    let uiScore = 100;
    let accessibilityScore = 100;
    let visualDesignScore = 100;
    let productExperienceScore = 100;
    let mobileUxScore = 100;

    // 2. Compute deductions per issue based on severity
    issues.forEach(issue => {
      let deduction = 0;
      switch (issue.severity) {
        case Severity.CRITICAL:
          deduction = 18;
          break;
        case Severity.HIGH:
          deduction = 12;
          break;
        case Severity.MEDIUM:
          deduction = 7;
          break;
        case Severity.LOW:
          deduction = 4;
          break;
        case Severity.INFO:
          deduction = 1;
          break;
      }

      const text = `${issue.title} ${issue.description} ${issue.uxPrinciple} ${issue.referenceGuideline} ${issue.id}`.toLowerCase();

      // Deduct from primary categories based on matching terms
      if (issue.category === 'UX_RULES') {
        uxScore -= deduction;
      } else {
        uiScore -= deduction;
      }

      // Accessibility rules
      if (text.includes('wcag') || text.includes('contrast') || text.includes('touch target') || text.includes('accessibility') || text.includes('a11y')) {
        accessibilityScore -= deduction;
      }

      // Visual Design rules
      if (text.includes('visual') || text.includes('harmony') || text.includes('alignment') || text.includes('symmetry') || text.includes('aesthetic') || text.includes('polish')) {
        visualDesignScore -= deduction;
      }

      // Product Experience
      if (text.includes('conversion') || text.includes('cta') || text.includes('funnel') || text.includes('friction') || text.includes('product') || text.includes('decision')) {
        productExperienceScore -= deduction;
      }

      // Mobile UX
      if (text.includes('mobile') || text.includes('thumb') || text.includes('responsive') || text.includes('touch') || text.includes('reach')) {
        mobileUxScore -= deduction;
      }
    });

    // 3. Ensure scores don't drop below a minimum visual floor of 30, and never exceed 100
    const clamp = (val: number) => Math.max(30, Math.min(100, val));

    uxScore = clamp(uxScore);
    uiScore = clamp(uiScore);
    accessibilityScore = clamp(accessibilityScore);
    visualDesignScore = clamp(visualDesignScore);
    productExperienceScore = clamp(productExperienceScore);
    mobileUxScore = clamp(mobileUxScore);

    // 4. Overall Design Health as a balanced average of categories
    const overallHealth = Math.round(
      (uxScore + uiScore + accessibilityScore + visualDesignScore + productExperienceScore + mobileUxScore) / 6
    );

    // 5. Compute mean confidence score across all findings (or default to 95 if perfect)
    const confidenceScore = issues.length > 0
      ? Math.round(issues.reduce((sum, issue) => sum + (issue.confidence || 80), 0) / issues.length)
      : 95;

    return {
      overallHealth: clamp(overallHealth),
      uxScore,
      uiScore,
      accessibilityScore,
      visualDesignScore,
      productExperienceScore,
      mobileUxScore,
      confidenceScore: clamp(confidenceScore),
    };
  }
}
