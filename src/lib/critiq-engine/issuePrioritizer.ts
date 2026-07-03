/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue, IssueSeverity } from './types';

export class IssuePrioritizer {
  /**
   * Sort and prioritize a list of Critiq Issues based on composite impact scores
   */
  public static prioritize(issues: CritiqIssue[]): CritiqIssue[] {
    const prioritized = issues.map(issue => {
      const score = this.calculatePriorityScore(issue);
      const severity = this.determinePrioritySeverity(score);

      return {
        ...issue,
        priorityScore: score,
        severity
      };
    });

    // Sort descending by priority score
    return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Calculate a multi-criteria priority score
   */
  private static calculatePriorityScore(issue: CritiqIssue): number {
    let score = 0;

    // 1. Severity Contribution
    switch (issue.severity) {
      case IssueSeverity.CRITICAL: score += 100; break;
      case IssueSeverity.HIGH: score += 70; break;
      case IssueSeverity.MEDIUM: score += 40; break;
      case IssueSeverity.LOW: score += 15; break;
    }

    // 2. Confidence Scale (scaled to 15 max)
    score += (issue.confidence || 80) * 0.15;

    // 3. User & Business Impact Multipliers
    const impactMap = { High: 20, Medium: 10, Low: 3 };
    score += impactMap[issue.userImpact] || 10;
    score += impactMap[issue.businessImpact] || 10;
    score += impactMap[issue.accessibilityImpact] || 10;

    // 4. Keyword/Context Clues (Frequency, Friction, Task Importance, Sizing)
    const textContext = `${issue.title} ${issue.description} ${issue.category}`.toLowerCase();

    // Primary Task / Conversion Importance
    if (textContext.includes('cta') || textContext.includes('checkout') || textContext.includes('primary') || textContext.includes('login') || textContext.includes('form')) {
      score += 15;
    }

    // User Friction
    if (textContext.includes('friction') || textContext.includes('barrier') || textContext.includes('confus') || textContext.includes('stuck') || textContext.includes('cognitive')) {
      score += 12;
    }

    // Visual Prominence / Spatial Sizing
    const bboxArea = (issue.boundingBox?.width || 10) * (issue.boundingBox?.height || 5);
    if (bboxArea > 300) {
      score += 10; // Large element issue is highly visible
    }

    return Math.round(score);
  }

  /**
   * Categorize the computed score back to one of the strict visual Priority Severity levels
   */
  private static determinePrioritySeverity(score: number): IssueSeverity {
    if (score >= 130) return IssueSeverity.CRITICAL;
    if (score >= 90) return IssueSeverity.HIGH;
    if (score >= 55) return IssueSeverity.MEDIUM;
    return IssueSeverity.LOW;
  }
}
