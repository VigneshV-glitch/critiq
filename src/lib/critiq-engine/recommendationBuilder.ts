/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqIssue, CritiqRecommendation, IssueCategory } from './types';

export class RecommendationBuilder {
  /**
   * Augment CritiqIssues with educational recommendations, and return separate CritiqRecommendations
   */
  public static populateRecommendations(issues: CritiqIssue[]): CritiqRecommendation[] {
    const recommendations: CritiqRecommendation[] = [];

    issues.forEach(issue => {
      const text = `${issue.title} ${issue.description}`.toLowerCase();
      
      // Default initial templates
      let problem = `The affected element lacks appropriate design system visual markers.`;
      let whyItMatters = `Visual ambiguity elevates cognitive friction and creates user hesitation before clicking.`;
      let rootCause = `Non-standard layout positioning or lack of clear CSS tokens.`;
      let quickFix = `Increase sizing, contrast, and spacing parameters around the component.`;
      let recommendedSolution = `Apply consistent margin and padding rules, and bind styles to global design system values.`;
      let bestPractice = `Use fluid layouts and tokenized variables to handle color, spacing, and size variations symmetrically.`;
      let uxPrinciple = `Aesthetic-Usability Effect`;
      let accessibilityGuideline = `WCAG 1.4: Distinguishable Content`;
      let expectedImprovement = `User clicking speed and navigation accuracy will improve, making the user experience more satisfying.`;
      let learningNotes = `In visual interfaces, form always follows function. High-quality layouts communicate active status through distinct element proportions.`;

      // Match categories or key terms for customized, professional educational content
      if (issue.category === IssueCategory.CONTRAST || text.includes('contrast') || text.includes('color')) {
        uxPrinciple = `Visual Percievability / Gestalt`;
        accessibilityGuideline = `WCAG 1.4.3: Contrast (Minimum)`;
        problem = `Substandard foreground-to-background contrast ratio makes the text or element hard to distinguish.`;
        whyItMatters = `Substandard color contrast causes immediate readability failure for low-vision users and strains eyes in bright glare environments.`;
        rootCause = `Applying static or unverified gray shades instead of accessible design system hex color variables.`;
        quickFix = `Darken the text color (or lighten on dark backgrounds) to make it stand out instantly.`;
        recommendedSolution = `Ensure the text contrast is at least 4.5:1 for regular text and 3:1 for large headings by selecting accessible palette hex codes.`;
        bestPractice = `Establish an automated lint checker or token-based palette that guarantees accessibility compliance across all system themes.`;
        expectedImprovement = `Text readability and character recognition become effortless, ensuring compliance with AA guidelines.`;
        learningNotes = `Contrast is not just about aesthetics; it is a fundamental access requirement. A clean layout ensures all characters are legible across varying light settings.`;
      } 
      else if (issue.category === IssueCategory.MOBILE_UX || text.includes('touch target') || text.includes('size') || text.includes('finger')) {
        uxPrinciple = `Fitts's Law (Target Sizing)`;
        accessibilityGuideline = `WCAG 2.5.5: Target Size`;
        problem = `Undersized interactive boundaries make the button or element hard to select accurately on touch devices.`;
        whyItMatters = `Undersized touch zones lead to user frustration, misclicks, and accidental triggers of nearby links.`;
        rootCause = `Binding click handlers directly to small text labels without providing comfortable container padding.`;
        quickFix = `Increase the outer wrapping click container padding immediately to 44px.`;
        recommendedSolution = `Refactor the button wrapper to guarantee a minimum bounding target of 44x44px (or 48x48px on Android) with 8px of safety gap between adjacent click actions.`;
        bestPractice = `Configure a global CSS touch-target rule so touch targets dynamically resize to at least 44x44px on mobile screens.`;
        expectedImprovement = `Misclick frequency is minimized, leading to a much smoother mobile transaction and check-out funnel.`;
        learningNotes = `Fitts's Law establishes that the time to acquire a target is a function of the distance to and size of the target. Larger buttons are clicked significantly faster.`;
      }
      else if (issue.category === IssueCategory.BUTTONS || issue.category === IssueCategory.NAVIGATION || text.includes('cta') || text.includes('primary')) {
        uxPrinciple = `Hick's Law / Decision Architecture`;
        accessibilityGuideline = `WCAG 3.2: Predictable Interface`;
        problem = `Primary call-to-action (CTA) does not possess clear visual dominance or is competing with secondary triggers.`;
        whyItMatters = `When primary and secondary actions look identical, users experience decision paralysis, which hurts conversion rates.`;
        rootCause = `Failing to establish a clear style hierarchy (such as solid vs outline vs text-only buttons) for user actions.`;
        quickFix = `Add a solid filled background color to the primary action.`;
        recommendedSolution = `Reposition the primary action to the top right or bottom right of the container, styled with an accent background color, while demoting secondary actions to border outline states.`;
        bestPractice = `Maintain exactly one primary high-priority call-to-action per screen area. Pair it with clear, benefit-driven verb phrases (e.g. "Create Profile").`;
        expectedImprovement = `Navigation paths become highly predictable, boosting user onboarding success and form completion rates.`;
        learningNotes = `Reducing the number of choices and visual cues speeds up target selection. A distinct button hierarchy guides the eye to the next logical step.`;
      }
      else if (issue.category === IssueCategory.SPACING || issue.category === IssueCategory.ALIGNMENT || text.includes('margin') || text.includes('padding') || text.includes('grid')) {
        uxPrinciple = `Law of Proximity (Gestalt)`;
        accessibilityGuideline = `WCAG 1.3.1: Info and Relationships`;
        problem = `Asymmetric margins or uneven gaps cause visual instability and make the screen appear unpolished.`;
        whyItMatters = `Asymmetric alignment disrupts standard reading patterns, and cluttered margins make scanning the screen chaotic.`;
        rootCause = `Using arbitrary margin-left or padding-top pixel values instead of snapping components to a standardized layout grid.`;
        quickFix = `Apply symmetric padding and align adjacent components on a consistent layout line.`;
        recommendedSolution = `Implement a strict 8px spatial grid scale (e.g., 8px, 16px, 24px, 32px) for all element margins, paddings, and flex/grid gap sizes.`;
        bestPractice = `Establish clear container structures with responsive CSS flex/grid layouts to prevent elements from breaking alignment across viewports.`;
        expectedImprovement = `The visual composition looks highly professional and stable, creating an intuitive structure for natural layout scanning.`;
        learningNotes = `Symmetrical whitespace is a critical design tool. Proper alignment organizes the screen, creating visual breathing room that reduces cognitive fatigue.`;
      }

      // If issue has a recommended action from its original run, merge it beautifully
      if (issue.recommendedSolution && issue.recommendedSolution !== 'Consider layout adjustments.') {
        recommendedSolution = `${issue.recommendedSolution}`;
      }

      // Bind educational details back to the issue object
      issue.problem = problem;
      issue.whyItMatters = whyItMatters;
      issue.rootCause = rootCause;
      issue.quickFix = quickFix;
      issue.recommendedSolution = recommendedSolution;
      issue.bestPractice = bestPractice;
      issue.uxPrinciple = uxPrinciple;
      issue.accessibilityGuideline = accessibilityGuideline;
      issue.expectedImprovement = expectedImprovement;
      issue.learningNotes = learningNotes;

      // Extract separate recommendation record
      recommendations.push({
        issueId: issue.id,
        problem,
        whyItMatters,
        quickFix,
        recommendedSolution,
        bestPractice,
        uxPrinciple,
        expectedImprovement
      });
    });

    return recommendations;
  }
}
