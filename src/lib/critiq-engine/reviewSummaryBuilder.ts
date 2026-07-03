/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue } from './types';
import { ScreenModel } from '../screen-understanding/screenModel';

export class ReviewSummaryBuilder {
  public static buildSummary(
    screenModel: ScreenModel,
    issues: CritiqIssue[]
  ): string {
    const screenType = screenModel.classification?.screenType || 'Screen';
    const platform = screenModel.platform || 'Device';
    const totalIssues = issues.length;

    if (totalIssues === 0) {
      return `The Critiq design review pipeline has analyzed your ${platform} ${screenType} layout. No critical heuristic deviations or visual layout defects were observed. The composition satisfies fundamental visual hierarchy guidelines, presenting clean element proportions and alignment.`;
    }

    const criticalCount = issues.filter(i => i.severity === 'Critical').length;
    const highCount = issues.filter(i => i.severity === 'High').length;
    const mediumCount = issues.filter(i => i.severity === 'Medium').length;

    let summary = `This Critiq Heuristic Design Review evaluated the layout structure of your ${platform} ${screenType}. `;
    summary += `A total of ${totalIssues} points of interest were analyzed, including ${criticalCount} critical blocker(s), ${highCount} high-priority visual issue(s), and ${mediumCount} secondary concern(s). `;

    // Detail dominant issues if available
    if (criticalCount > 0) {
      const dominantIssues = issues
        .filter(i => i.severity === 'Critical')
        .slice(0, 2)
        .map(i => `"${i.title}"`)
        .join(' and ');
      summary += `Visual blockers such as ${dominantIssues} currently disrupt the reading sequence and compromise user interaction. `;
    } else if (highCount > 0) {
      const keyIssues = issues
        .filter(i => i.severity === 'High')
        .slice(0, 2)
        .map(i => `"${i.title}"`)
        .join(' and ');
      summary += `The most significant opportunities for layout refinement center on ${keyIssues}, which degrade visual stability and focus. `;
    }

    summary += `Addressing these items will enhance cognitive navigation, improve touch targets on smaller viewports, and elevate overall usability metrics to align with industry design-system standards.`;

    return summary;
  }
}
