/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScoreCategory {
  score: number;
  max: number;
  label: string;
}

export interface ScoreBreakdown {
  visualDesign: ScoreCategory;
  usability: ScoreCategory;
  accessibility: ScoreCategory;
  consistency: ScoreCategory;
}

export function calculateReportScore(issues: any[]): { score: number; breakdown: ScoreBreakdown } {
  // Categories mapped to the four required user-facing scores
  const categories = {
    visualDesign: { score: 25, max: 25, label: 'Visual Design' },
    usability: { score: 25, max: 25, label: 'Usability' },
    accessibility: { score: 25, max: 25, label: 'Accessibility' },
    consistency: { score: 25, max: 25, label: 'Consistency' }
  };

  issues.forEach((issue) => {
    const key = (issue.ruleKey || '').toLowerCase();
    const title = (issue.title || '').toLowerCase();
    const desc = (issue.description || '').toLowerCase();

    // Determine category using comprehensive heuristics based on keywords and types
    let category: 'visualDesign' | 'usability' | 'accessibility' | 'consistency' = 'visualDesign';

    // 1. Accessibility Indicators
    if (
      key.includes('contrast') || title.includes('contrast') || desc.includes('contrast') ||
      key.includes('accessibility') || title.includes('accessibility') || desc.includes('accessibility') ||
      key.includes('wcag') || title.includes('wcag') || desc.includes('wcag') ||
      key.includes('readability') || title.includes('readability') || desc.includes('readability') ||
      key.includes('focus') || title.includes('focus') || desc.includes('focus') ||
      key.includes('color_dependency') || key.includes('color-dependency') ||
      title.includes('color dependency') || desc.includes('color dependency') ||
      key.includes('touch') || title.includes('touch') || desc.includes('touch') ||
      title.includes('target size') || desc.includes('target size')
    ) {
      category = 'accessibility';
    }
    // 2. Consistency Indicators
    else if (
      key.includes('consistency') || title.includes('consistency') || desc.includes('consistency') ||
      key.includes('spacing_grid') || key.includes('grid') || title.includes('grid') || desc.includes('grid') ||
      key.includes('design_system') || key.includes('design-system') || title.includes('design system') || desc.includes('design system') ||
      key.includes('brand') || title.includes('brand') || desc.includes('brand') ||
      title.includes('spacing deviation') || desc.includes('spacing deviation') ||
      key.includes('reuse') || title.includes('reuse') || desc.includes('reuse')
    ) {
      category = 'consistency';
    }
    // 3. Usability Indicators
    else if (
      key.includes('usability') || title.includes('usability') || desc.includes('usability') ||
      key.includes('heuristic') || title.includes('heuristic') || desc.includes('heuristic') ||
      key.includes('fitts') || title.includes('fitts') || desc.includes('fitts') ||
      key.includes('hick') || title.includes('hick') || desc.includes('hick') ||
      key.includes('friction') || title.includes('friction') || desc.includes('friction') ||
      key.includes('workflow') || title.includes('workflow') || desc.includes('workflow') ||
      key.includes('navigation') || title.includes('navigation') || desc.includes('navigation') ||
      key.includes('cognitive') || title.includes('cognitive') || desc.includes('cognitive') ||
      key.includes('efficiency') || title.includes('efficiency') || desc.includes('efficiency') ||
      key.includes('control') || title.includes('control') || desc.includes('control') ||
      key.includes('error_prevention') || title.includes('error prevention') || desc.includes('error prevention')
    ) {
      category = 'usability';
    }
    // 4. Visual Design (Defaults or specific indicators)
    else {
      category = 'visualDesign';
    }

    const sev = (issue.severity || 'medium').toLowerCase();
    let penalty = 0;
    if (sev === 'critical') {
      penalty = 8;
    } else if (sev === 'high') {
      penalty = 5;
    } else if (sev === 'medium') {
      penalty = 3;
    } else if (sev === 'low') {
      penalty = 1.5;
    } else if (sev === 'info') {
      penalty = 0;
    } else {
      penalty = 3;
    }

    categories[category].score = Math.max(0, categories[category].score - penalty);
  });

  const finalScore = Math.max(30, Math.min(100, Math.round(
    categories.visualDesign.score +
    categories.usability.score +
    categories.accessibility.score +
    categories.consistency.score
  )));

  return {
    score: finalScore,
    breakdown: {
      visualDesign: { score: Math.round(categories.visualDesign.score), max: 25, label: 'Visual Design' },
      usability: { score: Math.round(categories.usability.score), max: 25, label: 'Usability' },
      accessibility: { score: Math.round(categories.accessibility.score), max: 25, label: 'Accessibility' },
      consistency: { score: Math.round(categories.consistency.score), max: 25, label: 'Consistency' }
    }
  };
}
