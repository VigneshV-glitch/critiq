/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue, IssueCategory, IssueSeverity } from './types';
import { BoundingBox, Severity } from '../../types';

export class IssueNormalizer {
  /**
   * Normalize and merge incoming issues from active agents into stable CritiqIssues
   */
  public static normalizeAndMerge(rawIssues: any[]): CritiqIssue[] {
    const normalizedIssues: CritiqIssue[] = [];

    rawIssues.forEach((raw, idx) => {
      const id = raw.id || `issue_${Date.now()}_${idx}`;
      
      // Standardize severity
      let severity = IssueSeverity.MEDIUM;
      const rawSev = String(raw.severity || '').toLowerCase();
      if (rawSev.includes('crit')) severity = IssueSeverity.CRITICAL;
      else if (rawSev.includes('high')) severity = IssueSeverity.HIGH;
      else if (rawSev.includes('med')) severity = IssueSeverity.MEDIUM;
      else if (rawSev.includes('low')) severity = IssueSeverity.LOW;

      // Bound coordinate limits
      const x = Math.max(0, Math.min(100, typeof raw.boundingBox?.x === 'number' ? raw.boundingBox.x : 10));
      const y = Math.max(0, Math.min(100, typeof raw.boundingBox?.y === 'number' ? raw.boundingBox.y : 10));
      const width = Math.max(1, Math.min(100 - x, typeof raw.boundingBox?.width === 'number' ? raw.boundingBox.width : 40));
      const height = Math.max(1, Math.min(100 - y, typeof raw.boundingBox?.height === 'number' ? raw.boundingBox.height : 10));

      const evidenceText = raw.evidence || raw.description || 'Observed visual discrepancy.';

      // Determine initial impact attributes based on severity
      const impact = this.inferImpacts(severity, raw.title + ' ' + raw.description);

      const issue: CritiqIssue = {
        id,
        category: IssueCategory.UNKNOWN, // Populated during classification
        severity,
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 80,
        title: raw.title || 'Visual Layout Variance',
        description: raw.description || 'Heuristic layout constraint deviated from best practice.',
        boundingBox: { x, y, width, height },
        evidence: [evidenceText],
        businessImpact: impact.business,
        userImpact: impact.user,
        accessibilityImpact: impact.accessibility,
        estimatedFixComplexity: impact.complexity,
        estimatedFixTime: impact.time,
        priorityScore: 0, // Calculated later
        problem: '',
        whyItMatters: '',
        rootCause: '',
        quickFix: '',
        recommendedSolution: raw.recommendation || '',
        bestPractice: '',
        uxPrinciple: raw.uxPrinciple || 'Aesthetic-Usability Effect',
        accessibilityGuideline: raw.referenceGuideline || 'WCAG 1.4: Distinguishable Content',
        expectedImprovement: '',
        learningNotes: ''
      };

      // Try to merge with already processed issues if they refer to the same spatial region or context
      let isMerged = false;
      for (const existing of normalizedIssues) {
        if (this.shouldMerge(issue, existing)) {
          this.mergeIssues(existing, issue);
          isMerged = true;
          break;
        }
      }

      if (!isMerged) {
        normalizedIssues.push(issue);
      }
    });

    return normalizedIssues;
  }

  /**
   * Assess if two findings describe the same UI layout concern
   */
  private static shouldMerge(a: CritiqIssue, b: CritiqIssue): boolean {
    // 1. High overlap (IoU) of the screen region
    const overlap = this.calculateOverlap(a.boundingBox, b.boundingBox);
    if (overlap > 0.35) {
      return true;
    }

    // 2. Proximity + Keyword similarity
    const centerDist = this.calculateDistance(a.boundingBox, b.boundingBox);
    if (centerDist < 22) { // Within ~22% viewport coordinates
      const lowerA = (a.title + ' ' + a.description).toLowerCase();
      const lowerB = (b.title + ' ' + b.description).toLowerCase();
      
      const matchKeywords = ['contrast', 'navigation', 'spacing', 'alignment', 'touch target', 'font', 'cta', 'form'];
      for (const keyword of matchKeywords) {
        if (lowerA.includes(keyword) && lowerB.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Perform actual in-place merge of source issue into target issue
   */
  private static mergeIssues(target: CritiqIssue, source: CritiqIssue): void {
    // 1. Boost confidence (confidence goes up as multiple agents report the same issue)
    target.confidence = Math.min(100, Math.round(Math.max(target.confidence, source.confidence) + 10));

    // 2. Synthesize titles if they represent different parts
    if (!target.title.toLowerCase().includes(source.title.toLowerCase().substring(0, 8))) {
      target.title = `${target.title} & ${source.title}`;
    }

    // 3. Append unique evidence
    source.evidence.forEach(ev => {
      if (!target.evidence.includes(ev)) {
        target.evidence.push(ev);
      }
    });

    // 4. Select higher severity level
    const ranks = { Low: 0, Medium: 1, High: 2, Critical: 3 };
    const targetRank = ranks[target.severity] || 0;
    const sourceRank = ranks[source.severity] || 0;
    if (sourceRank > targetRank) {
      target.severity = source.severity;
    }

    // 5. Union bounding boxes to cover both visual points
    const xMin = Math.min(target.boundingBox.x, source.boundingBox.x);
    const yMin = Math.min(target.boundingBox.y, source.boundingBox.y);
    const xMax = Math.max(target.boundingBox.x + target.boundingBox.width, source.boundingBox.x + source.boundingBox.width);
    const yMax = Math.max(target.boundingBox.y + target.boundingBox.height, source.boundingBox.y + source.boundingBox.height);

    target.boundingBox = {
      x: xMin,
      y: yMin,
      width: Math.min(100 - xMin, xMax - xMin),
      height: Math.min(100 - yMin, yMax - yMin)
    };
  }

  /**
   * Helper to calculate Intersection over Union (IoU) of coordinates
   */
  private static calculateOverlap(boxA: BoundingBox, boxB: BoundingBox): number {
    const xLeft = Math.max(boxA.x, boxB.x);
    const yTop = Math.max(boxA.y, boxB.y);
    const xRight = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yBottom = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    if (xRight < xLeft || yBottom < yTop) return 0;

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const areaA = boxA.width * boxA.height;
    const areaB = boxB.width * boxB.height;
    const unionArea = areaA + areaB - intersectionArea;

    return unionArea <= 0 ? 0 : intersectionArea / unionArea;
  }

  /**
   * Helper to find center-to-center distance
   */
  private static calculateDistance(boxA: BoundingBox, boxB: BoundingBox): number {
    const centerA = { x: boxA.x + boxA.width / 2, y: boxA.y + boxA.height / 2 };
    const centerB = { x: boxB.x + boxB.width / 2, y: boxB.y + boxB.height / 2 };
    return Math.sqrt(Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2));
  }

  /**
   * Helper to infer visual impact scales based on textual contexts
   */
  private static inferImpacts(severity: IssueSeverity, text: string): {
    business: 'High' | 'Medium' | 'Low';
    user: 'High' | 'Medium' | 'Low';
    accessibility: 'High' | 'Medium' | 'Low';
    complexity: 'High' | 'Medium' | 'Low';
    time: string;
  } {
    const lower = text.toLowerCase();
    
    let business: 'High' | 'Medium' | 'Low' = 'Low';
    let user: 'High' | 'Medium' | 'Low' = 'Medium';
    let accessibility: 'High' | 'Medium' | 'Low' = 'Low';
    let complexity: 'High' | 'Medium' | 'Low' = 'Medium';
    let time = '30 mins';

    // 1. Severity baselines
    if (severity === IssueSeverity.CRITICAL) {
      business = 'High';
      user = 'High';
      time = '1 hour';
    } else if (severity === IssueSeverity.HIGH) {
      business = 'Medium';
      user = 'High';
      time = '45 mins';
    }

    // 2. Key modifiers
    if (lower.includes('checkout') || lower.includes('cta') || lower.includes('conversion') || lower.includes('pay')) {
      business = 'High';
    }
    if (lower.includes('contrast') || lower.includes('wcag') || lower.includes('touch target') || lower.includes('accessibility')) {
      accessibility = 'High';
      user = 'High';
    }
    if (lower.includes('grid') || lower.includes('spacing') || lower.includes('margin')) {
      complexity = 'Low';
      time = '15 mins';
    }
    if (lower.includes('navigation') || lower.includes('menu') || lower.includes('re-anchor')) {
      complexity = 'Medium';
      time = '45 mins';
    }
    if (lower.includes('refactor') || lower.includes('rebuild') || lower.includes('database')) {
      complexity = 'High';
      time = '2 hours';
    }

    return { business, user, accessibility, complexity, time };
  }
}
