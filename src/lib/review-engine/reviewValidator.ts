/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentIssue } from './types';
import { Severity } from '../../types';

export class ReviewValidator {
  /**
   * Validate, sanitize, and filter merged issues
   */
  public static validateAndSanitize(issues: AgentIssue[]): AgentIssue[] {
    const validIssues: AgentIssue[] = [];

    issues.forEach((issue, index) => {
      // 1. Filter out low-confidence findings (< 40)
      if (issue.confidence && issue.confidence < 40) {
        console.warn(`[Review Validator] Discarding low-confidence issue (${issue.confidence}%): "${issue.title}"`);
        return;
      }

      // 2. Validate bounding box coordinates
      let bbox = issue.boundingBox;
      if (!bbox || typeof bbox.x !== 'number' || typeof bbox.y !== 'number' || typeof bbox.width !== 'number' || typeof bbox.height !== 'number') {
        console.warn(`[Review Validator] Fixing missing or malformed bounding box for issue "${issue.title}".`);
        bbox = { x: 10, y: 10, width: 80, height: 10 };
      }

      // Sanitize coordinates to stay within 0-100% boundary limits
      const x = Math.max(0, Math.min(100, bbox.x));
      const y = Math.max(0, Math.min(100, bbox.y));
      const width = Math.max(1, Math.min(100 - x, bbox.width));
      const height = Math.max(1, Math.min(100 - y, bbox.height));

      // 3. Ensure valid Severity enum mapping
      let severity: Severity = Severity.MEDIUM;
      const sevLower = String(issue.severity).toLowerCase();
      if (sevLower.includes('crit')) severity = Severity.CRITICAL;
      else if (sevLower.includes('high')) severity = Severity.HIGH;
      else if (sevLower.includes('med')) severity = Severity.MEDIUM;
      else if (sevLower.includes('low')) severity = Severity.LOW;
      else if (sevLower.includes('info')) severity = Severity.INFO;

      // 4. Ensure stable IDs
      const safeId = issue.id || `issue_${Date.now()}_${index}`;

      // 5. Build sanitized copy
      validIssues.push({
        ...issue,
        id: safeId,
        severity,
        boundingBox: { x, y, width, height },
        title: issue.title || 'Untitled Design Warning',
        description: issue.description || 'No descriptive details provided.',
        category: issue.category === 'UI_RULES' ? 'UI_RULES' : 'UX_RULES',
        confidence: typeof issue.confidence === 'number' ? issue.confidence : 80,
        affectedComponents: Array.isArray(issue.affectedComponents) ? issue.affectedComponents : [],
        evidence: issue.evidence || 'No visual evidence cataloged.',
        recommendation: issue.recommendation || 'No correction steps provided.'
      });
    });

    return validIssues;
  }
}
