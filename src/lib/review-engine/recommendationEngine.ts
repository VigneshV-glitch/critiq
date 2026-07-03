/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentIssue, Recommendation } from './types';

export class RecommendationEngine {
  /**
   * Generate robust educational recommendations for each detected issue
   */
  public static generate(issues: AgentIssue[]): Recommendation[] {
    return issues.map(issue => {
      const textContext = `${issue.title} ${issue.description} ${issue.uxPrinciple} ${issue.referenceGuideline}`.toLowerCase();
      
      let quickFix = `Increase visual prominence and padding of the affected element.`;
      let recommendedFix = `Refactor the affected component to align with vendor-neutral design system standards. Ensure correct structural nesting and semantic tags are applied.`;
      let bestPractice = `Incorporate design system tokens for spacing, elevation, and typography. Always conduct usability testing with target users to validate design clarity.`;
      let educationalExplanation = `According to fundamental design principles, interfaces should communicate function through visual structure. Unclear or crowded placements elevate cognitive friction and drop conversion success.`;
      let expectedOutcome = `Users can navigate, interact, and complete primary screen transactions with reduced cognitive load and fewer errors.`;
      let relatedUxPrinciple = issue.uxPrinciple || `Aesthetic-Usability Effect`;

      // Match common issues based on keywords
      if (textContext.includes('contrast') || textContext.includes('color') || textContext.includes('theme')) {
        relatedUxPrinciple = 'Visual Accessibility (WCAG 1.4.3)';
        quickFix = `Increase color contrast ratio of the text or icon to at least 4.5:1.`;
        recommendedFix = `Adjust background or foreground styles to meet WCAG AA guidelines. For dark themes, prefer soft off-whites on charcoal instead of pure black and white.`;
        bestPractice = `Establish an automated lint checker or token-based palette that guarantees accessibility compliance across all system themes.`;
        educationalExplanation = `Sufficient contrast is critical for low-vision users and prevents physical squinting/eye fatigue, especially when using devices in extreme glare or high-light settings.`;
        expectedOutcome = `All text elements become fully perceivable, restoring accessibility compliance and comfort for all users.`;
      } 
      else if (textContext.includes('touch target') || textContext.includes('small') || textContext.includes('cramped') || textContext.includes('thumb')) {
        relatedUxPrinciple = "Fitts's Law";
        quickFix = `Increase the interactive container padding size to 44px.`;
        recommendedFix = `Apply standard mobile tapping standards by resizing the click wrapper bounds and separating closely nested clickable elements by 8px.`;
        bestPractice = `Configure a global CSS touch-target rule so touch targets dynamically resize to at least 44x44px (or 48x48px on Android platforms) on mobile screens.`;
        educationalExplanation = `Fitts's Law dictates that target acquisition is a function of target size and distance. Small controls raise thumb strain and lead to accidental misclicks.`;
        expectedOutcome = `Click/touch accuracy improves significantly, promoting a more fluid mobile navigation experience.`;
      }
      else if (textContext.includes('cta') || textContext.includes('button') || textContext.includes('primary') || textContext.includes('action')) {
        relatedUxPrinciple = "Hick's Law / Decision Architecture";
        quickFix = `Style the primary button with highly prominent accent colors.`;
        recommendedFix = `Re-anchor the main CTA in a clear container with plenty of negative space. Ensure secondary triggers are styled with outline or text-only states.`;
        bestPractice = `Provide only one clear, primary conversion CTA per screen view. Use benefit-driven verb phrasing (e.g. "Create Profile") instead of lazy terms (e.g. "Submit").`;
        educationalExplanation = `Reducing choices speeds up target selection. Over-crowding the screen with competing CTAs results in user decision paralysis and lower sign-ups.`;
        expectedOutcome = `Guarantees a frictionless user onboarding path and drives higher product conversion rates.`;
      }
      else if (textContext.includes('margin') || textContext.includes('padding') || textContext.includes('asymmetric') || textContext.includes('spacing')) {
        relatedUxPrinciple = 'Law of Proximity / Gestalt';
        quickFix = `Balance outer margins symmetrically and group adjacent elements using consistent grid gaps.`;
        recommendedFix = `Establish a strict 8px spatial grid scale (e.g., 8px, 16px, 24px, 32px) for margins, padding, and gaps to anchor the composition.`;
        bestPractice = `Use fluid, auto-calculating CSS flexbox and grids to prevent static spacing bugs across varying viewport widths.`;
        educationalExplanation = `Human minds automatically group elements that are close to one another. Symmetrical whitespace creates a sense of layout stability and professional polish.`;
        expectedOutcome = `Layout scanning becomes natural and predictable, highlighting clear content hierarchies.`;
      }

      // If the issue already had clear recommendations from the agent, merge them beautifully
      if (issue.recommendation) {
        quickFix = `${issue.recommendation} (Quick action)`;
      }

      return {
        issueId: issue.id,
        quickFix,
        recommendedFix,
        bestPractice,
        educationalExplanation,
        expectedOutcome,
        relatedUxPrinciple
      };
    });
  }
}
