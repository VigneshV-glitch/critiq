/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentIssue, AgentResponse } from './types';
import { BoundingBox } from '../../types';

export class ReviewMerger {
  /**
   * Consolidate and merge issues across all agent responses
   */
  public static merge(responses: AgentResponse[]): AgentIssue[] {
    const allIssues: AgentIssue[] = [];
    
    // Flatten all issues from all agents
    for (const res of responses) {
      for (const issue of res.detectedIssues) {
        // Tag with the reporting agent
        allIssues.push({
          ...issue,
          evidence: `[${res.agentName}]: ${issue.evidence}`
        });
      }
    }

    const mergedIssues: AgentIssue[] = [];

    for (const current of allIssues) {
      let isMerged = false;

      // Compare with already merged issues to see if there is a match
      for (const existing of mergedIssues) {
        if (this.shouldMerge(current, existing)) {
          this.mergeIssues(existing, current);
          isMerged = true;
          break;
        }
      }

      if (!isMerged) {
        // Add as a new merged entry (deep copy to avoid mutation bugs)
        mergedIssues.push({ ...current });
      }
    }

    return mergedIssues;
  }

  /**
   * Helper to check if two issues refer to the same visual/interaction problem
   */
  private static shouldMerge(a: AgentIssue, b: AgentIssue): boolean {
    // 1. Shared affected components
    const hasSharedComponent = a.affectedComponents.some(cId => b.affectedComponents.includes(cId));
    if (hasSharedComponent && a.affectedComponents.length > 0) {
      return true;
    }

    // 2. High bounding box overlap (Intersection over Union / Proximity)
    const bboxOverlap = this.calculateOverlap(a.boundingBox, b.boundingBox);
    if (bboxOverlap > 0.4) {
      return true;
    }

    // 3. Keyword/Topic overlap + close spatial proximity
    const titleMatchKeywords = ['navigation', 'cta', 'contrast', 'alignment', 'margin', 'spacing', 'touch target', 'font', 'form'];
    const lowerA = a.title.toLowerCase() + ' ' + a.description.toLowerCase();
    const lowerB = b.title.toLowerCase() + ' ' + b.description.toLowerCase();

    for (const keyword of titleMatchKeywords) {
      if (lowerA.includes(keyword) && lowerB.includes(keyword)) {
        // Check if bounding boxes are at least nearby
        const dist = this.calculateDistance(a.boundingBox, b.boundingBox);
        if (dist < 25) { // within 25% screen distance
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate overlap ratio (IoU-like) between two bounding boxes
   */
  private static calculateOverlap(boxA: BoundingBox, boxB: BoundingBox): number {
    const xLeft = Math.max(boxA.x, boxB.x);
    const yTop = Math.max(boxA.y, boxB.y);
    const xRight = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yBottom = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    if (xRight < xLeft || yBottom < yTop) {
      return 0; // No intersection
    }

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const areaA = boxA.width * boxA.height;
    const areaB = boxB.width * boxB.height;
    const unionArea = areaA + areaB - intersectionArea;

    if (unionArea <= 0) return 0;
    return intersectionArea / unionArea;
  }

  /**
   * Calculate distance between centers of two bounding boxes
   */
  private static calculateDistance(boxA: BoundingBox, boxB: BoundingBox): number {
    const centerA = { x: boxA.x + boxA.width / 2, y: boxA.y + boxA.height / 2 };
    const centerB = { x: boxB.x + boxB.width / 2, y: boxB.y + boxB.height / 2 };
    return Math.sqrt(Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2));
  }

  /**
   * Merge issue "source" into "target" in-place
   */
  private static mergeIssues(target: AgentIssue, source: AgentIssue): void {
    // 1. Boost confidence score up to 100
    const boostedConfidence = Math.min(100, Math.round(Math.max(target.confidence, source.confidence) + 8));
    target.confidence = boostedConfidence;

    // 2. Combine descriptions and titles if unique
    if (!target.title.toLowerCase().includes(source.title.toLowerCase().substring(0, 10))) {
      target.title = `${target.title} & ${source.title}`;
    }

    // 3. Append bulleted evidence logs
    target.evidence = `${target.evidence}\n${source.evidence}`;

    // 4. Unique merge of affected components
    const componentSet = new Set([...target.affectedComponents, ...source.affectedComponents]);
    target.affectedComponents = Array.from(componentSet);

    // 5. Select higher severity
    const severityRanking = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const targetRank = severityRanking[target.severity] || 0;
    const sourceRank = severityRanking[source.severity] || 0;
    if (sourceRank > targetRank) {
      target.severity = source.severity;
    }

    // 6. Union of bounding boxes to cover the entire affected zone
    const xMin = Math.min(target.boundingBox.x, source.boundingBox.x);
    const yMin = Math.min(target.boundingBox.y, source.boundingBox.y);
    const xMax = Math.max(target.boundingBox.x + target.boundingBox.width, source.boundingBox.x + source.boundingBox.width);
    const yMax = Math.max(target.boundingBox.y + target.boundingBox.height, source.boundingBox.y + source.boundingBox.height);

    target.boundingBox = {
      x: xMin,
      y: yMin,
      width: xMax - xMin,
      height: yMax - yMin,
    };
  }
}
