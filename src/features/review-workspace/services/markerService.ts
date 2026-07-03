/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue } from '../../../lib/critiq-engine/types';

export interface MarkerClusterItem {
  id: string;
  isCluster: boolean;
  issues: CritiqIssue[];
  boundingBox: { x: number; y: number; width: number; height: number };
  centerPercent: { x: number; y: number };
}

export const markerService = {
  /**
   * Performs distance-based clustering on a set of issues.
   * @param issues List of issues to cluster.
   * @param zoomScale Current scale of the viewport. At high zoom, clusters break apart.
   * @param clusterRadiusPercent Percentage-based distance below which we cluster (e.g. 6%).
   */
  clusterIssues: (
    issues: CritiqIssue[],
    zoomScale: number,
    clusterRadiusPercent: number = 6
  ): MarkerClusterItem[] => {
    // Dynamic cluster radius: smaller radius at high zoom scales so clusters split up
    const effectiveRadius = clusterRadiusPercent / Math.sqrt(zoomScale);
    
    const results: MarkerClusterItem[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < issues.length; i++) {
      const issueA = issues[i];
      if (visited.has(issueA.id)) continue;

      const clusterIssues: CritiqIssue[] = [issueA];
      visited.add(issueA.id);

      const ax = issueA.boundingBox.x;
      const ay = issueA.boundingBox.y;

      // Find nearby issues
      for (let j = i + 1; j < issues.length; j++) {
        const issueB = issues[j];
        if (visited.has(issueB.id)) continue;

        const bx = issueB.boundingBox.x;
        const by = issueB.boundingBox.y;

        // Euclidean distance in percentage points
        const distance = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));

        if (distance < effectiveRadius) {
          clusterIssues.push(issueB);
          visited.add(issueB.id);
        }
      }

      // If multiple issues, it's a cluster.
      if (clusterIssues.length > 1) {
        // Compute average center coordinates
        let sumX = 0, sumY = 0, sumW = 0, sumH = 0;
        clusterIssues.forEach(iss => {
          sumX += iss.boundingBox.x;
          sumY += iss.boundingBox.y;
          sumW += iss.boundingBox.width;
          sumH += iss.boundingBox.height;
        });

        const count = clusterIssues.length;
        results.push({
          id: `cluster-${issueA.id}-${count}`,
          isCluster: true,
          issues: clusterIssues,
          boundingBox: {
            x: sumX / count,
            y: sumY / count,
            width: sumW / count,
            height: sumH / count,
          },
          centerPercent: {
            x: sumX / count,
            y: sumY / count,
          }
        });
      } else {
        results.push({
          id: issueA.id,
          isCluster: false,
          issues: [issueA],
          boundingBox: issueA.boundingBox,
          centerPercent: {
            x: issueA.boundingBox.x,
            y: issueA.boundingBox.y,
          }
        });
      }
    }

    return results;
  }
};
