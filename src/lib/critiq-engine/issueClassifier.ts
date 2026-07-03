/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue, IssueCategory } from './types';

export class IssueClassifier {
  /**
   * Classify an issue into exactly one of Critiq's formal design categories
   */
  public static classify(issue: CritiqIssue): IssueCategory {
    const text = `${issue.title} ${issue.description}`.toLowerCase();

    // 1. Accessibility & Contrast (Priority WCAG checks)
    if (text.includes('contrast') || text.includes('background') || text.includes('foreground')) {
      return IssueCategory.CONTRAST;
    }
    if (text.includes('accessibility') || text.includes('wcag') || text.includes('a11y') || text.includes('screen reader') || text.includes('aria')) {
      return IssueCategory.ACCESSIBILITY;
    }

    // 2. Mobile and Touch Checks
    if (text.includes('mobile') || text.includes('responsive') || text.includes('touch target') || text.includes('tap target') || text.includes('thumb')) {
      return IssueCategory.MOBILE_UX;
    }

    // 3. Spacing & Alignment (Symmetry rules)
    if (text.includes('align') || text.includes('centered') || text.includes('asymmetric') || text.includes('distort')) {
      return IssueCategory.ALIGNMENT;
    }
    if (text.includes('spacing') || text.includes('padding') || text.includes('margin') || text.includes('gap') || text.includes('gutter')) {
      return IssueCategory.SPACING;
    }

    // 4. Design System & Consistency
    if (text.includes('design system') || text.includes('token') || text.includes('brand') || text.includes('standard')) {
      return IssueCategory.DESIGN_SYSTEM;
    }
    if (text.includes('consistency') || text.includes('deviation') || text.includes('mismatch')) {
      return IssueCategory.CONSISTENCY;
    }

    // 5. High-level UI Components
    if (text.includes('button') || text.includes('cta') || text.includes('trigger') || text.includes('action link')) {
      return IssueCategory.BUTTONS;
    }
    if (text.includes('navigation') || text.includes('menu') || text.includes('header') || text.includes('sidebar') || text.includes('tab') || text.includes('breadcrumb')) {
      return IssueCategory.NAVIGATION;
    }
    if (text.includes('form') || text.includes('input') || text.includes('field') || text.includes('checkbox') || text.includes('dropdown') || text.includes('label')) {
      return IssueCategory.FORMS;
    }

    // 6. Visual Design properties
    if (text.includes('font') || text.includes('typography') || text.includes('text size') || text.includes('line height') || text.includes('serif') || text.includes('tracking')) {
      return IssueCategory.TYPOGRAPHY;
    }
    if (text.includes('color') || text.includes('palette') || text.includes('hue') || text.includes('gradient')) {
      return IssueCategory.COLOR;
    }
    if (text.includes('hierarchy') || text.includes('prominent') || text.includes('focus') || text.includes('dominant')) {
      return IssueCategory.VISUAL_HIERARCHY;
    }
    if (text.includes('layout') || text.includes('grid') || text.includes('density') || text.includes('column') || text.includes('card')) {
      return IssueCategory.LAYOUT;
    }

    // 7. Interactive feedback & flow
    if (text.includes('interaction') || text.includes('hover') || text.includes('click') || text.includes('state') || text.includes('transition') || text.includes('animation')) {
      return IssueCategory.INTERACTION;
    }

    // 8. Content Copy legibility
    if (text.includes('content') || text.includes('copy') || text.includes('text density') || text.includes('header text') || text.includes('microcopy')) {
      return IssueCategory.CONTENT;
    }

    // 9. Enterprise specific systems
    if (text.includes('enterprise') || text.includes('table') || text.includes('chart') || text.includes('complexity') || text.includes('widget')) {
      return IssueCategory.ENTERPRISE_UX;
    }

    // 10. Performance
    if (text.includes('performance') || text.includes('load') || text.includes('speed') || text.includes('weight')) {
      return IssueCategory.PERFORMANCE;
    }

    return IssueCategory.UNKNOWN;
  }
}
