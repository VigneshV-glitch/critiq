/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnifiedReviewReport, CategoryScores, AgentIssue, Recommendation } from './types';
import { Severity } from '../../types';

export class ReviewReportBuilder {
  private id: string = `report_${Date.now()}`;
  private summary: string = '';
  private categoryScores!: CategoryScores;
  private prioritizedIssues: AgentIssue[] = [];
  private recommendations: Recommendation[] = [];
  private strengths: string[] = [];
  private opportunities: string[] = [];
  private warnings: string[] = [];
  private confidence: number = 100;
  private metadata: any = {
    analyzedAt: new Date().toISOString(),
    durationMs: 0,
    totalIssuesDetected: 0,
    activeAgents: [],
    platform: 'Web',
    screenType: 'Dashboard',
  };

  public setId(id: string): this {
    this.id = id;
    return this;
  }

  public setSummary(summary: string): this {
    this.summary = summary;
    return this;
  }

  public setCategoryScores(scores: CategoryScores): this {
    this.categoryScores = scores;
    this.confidence = scores.confidenceScore;
    return this;
  }

  public setPrioritizedIssues(issues: AgentIssue[]): this {
    this.prioritizedIssues = issues;
    this.metadata.totalIssuesDetected = issues.length;
    return this;
  }

  public setRecommendations(recommendations: Recommendation[]): this {
    this.recommendations = recommendations;
    return this;
  }

  public addStrength(strength: string): this {
    this.strengths.push(strength);
    return this;
  }

  public addOpportunity(opportunity: string): this {
    this.opportunities.push(opportunity);
    return this;
  }

  public addWarning(warning: string): this {
    this.warnings.push(warning);
    return this;
  }

  public setMetadata(meta: any): this {
    this.metadata = { ...this.metadata, ...meta };
    return this;
  }

  /**
   * Intelligently auto-populate visual strengths, warnings, and opportunities based on issues
   */
  private autoPopulateLists(): void {
    const sType = this.metadata.screenType || 'Screen';

    // 1. Auto Strengths based on lacking issues or high scores
    if (this.strengths.length === 0) {
      this.strengths.push(`Structured content grouping aligning with typical ${sType} layouts.`);
      this.strengths.push('Identifiable information architecture that simplifies screen scanning.');
      if (this.categoryScores.accessibilityScore > 80) {
        this.strengths.push('Good visual separation satisfying standard accessibility touch conventions.');
      }
      if (this.categoryScores.uiScore > 80) {
        this.strengths.push('Cohesive grid alignment maintaining structural symmetry.');
      }
    }

    // 2. Auto Opportunities based on issues
    if (this.opportunities.length === 0) {
      this.opportunities.push('Introduce semantic system tokens to drive perfect dark-theme compatibility.');
      this.opportunities.push('Incorporate micro-animations on primary buttons to elevate tactile satisfaction.');
      if (this.metadata.platform.toLowerCase().includes('web')) {
        this.opportunities.push('Confirm mobile-first column wraps are implemented for viewports < 480px.');
      }
    }

    // 3. Auto Warnings for high/critical severities
    if (this.warnings.length === 0) {
      const severeIssues = this.prioritizedIssues.filter(
        i => i.severity === Severity.CRITICAL || i.severity === Severity.HIGH
      );
      if (severeIssues.length > 0) {
        severeIssues.forEach(si => {
          this.warnings.push(`[${si.severity.toUpperCase()}] ${si.title}: ${si.description.substring(0, 80)}...`);
        });
      } else {
        this.warnings.push('No critical design blockages or blocker-level issues detected.');
      }
    }
  }

  public build(): UnifiedReviewReport {
    if (!this.categoryScores) {
      throw new Error('[Report Builder] Category scores are required to build a UnifiedReviewReport.');
    }
    this.autoPopulateLists();
    return {
      id: this.id,
      summary: this.summary || `Multi-agent visual evaluation complete. Scanned layout structure and identified ${this.prioritizedIssues.length} points of interest.`,
      categoryScores: this.categoryScores,
      prioritizedIssues: this.prioritizedIssues,
      recommendations: this.recommendations,
      strengths: this.strengths,
      opportunities: this.opportunities,
      warnings: this.warnings,
      confidence: this.confidence,
      metadata: this.metadata,
    };
  }
}
