/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentIssue } from './types';
import { Severity } from '../../types';

export class ReviewPrioritizer {
  /**
   * Prioritize and rank the issues
   */
  public static prioritize(issues: AgentIssue[]): AgentIssue[] {
    return [...issues].sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA; // Descending order (highest priority first)
    });
  }

  /**
   * Calculate a composite priority score
   */
  private static calculatePriorityScore(issue: AgentIssue): number {
    let score = 0;

    // 1. Severity Weights
    switch (issue.severity) {
      case Severity.CRITICAL:
        score += 100;
        break;
      case Severity.HIGH:
        score += 70;
        break;
      case Severity.MEDIUM:
        score += 40;
        break;
      case Severity.LOW:
        score += 20;
        break;
      case Severity.INFO:
        score += 5;
        break;
    }

    // 2. Confidence Contribution (scaled 0 - 20)
    score += (issue.confidence || 80) * 0.2;

    // 3. User & Business Impact Multipliers
    const textContext = `${issue.title} ${issue.description} ${issue.uxPrinciple} ${issue.referenceGuideline}`.toLowerCase();

    // Accessibility Impact
    if (textContext.includes('wcag') || textContext.includes('contrast') || textContext.includes('touch target') || textContext.includes('accessibility')) {
      score += 15;
    }

    // Business Onboarding / CTA Conversion Impact
    if (textContext.includes('conversion') || textContext.includes('cta') || textContext.includes('funnel') || textContext.includes('friction') || textContext.includes('onboarding')) {
      score += 12;
    }

    // Navigation & Primary Tasks
    if (textContext.includes('navigation') || textContext.includes('menu') || textContext.includes('header') || textContext.includes('flow')) {
      score += 8;
    }

    return score;
  }
}
