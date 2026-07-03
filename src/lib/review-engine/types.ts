/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenModel } from '../screen-understanding/screenModel';
import { BoundingBox, Severity } from '../../types';

export interface AgentIssue {
  id: string;
  title: string;
  description: string;
  category: 'UX_RULES' | 'UI_RULES';
  severity: Severity;
  confidence: number;
  evidence: string;
  affectedComponents: string[];
  affectedArea: string;
  uxPrinciple: string;
  recommendation: string;
  estimatedImpact: string;
  referenceGuideline: string;
  boundingBox: BoundingBox;
}

export interface AgentResponse {
  agentName: string;
  category: string;
  summary: string;
  detectedIssues: AgentIssue[];
}

export interface Recommendation {
  issueId: string;
  quickFix: string;
  recommendedFix: string;
  bestPractice: string;
  educationalExplanation: string;
  expectedOutcome: string;
  relatedUxPrinciple: string;
}

export interface CategoryScores {
  overallHealth: number;
  uxScore: number;
  uiScore: number;
  accessibilityScore: number;
  visualDesignScore: number;
  productExperienceScore: number;
  mobileUxScore: number;
  confidenceScore: number;
}

export interface UnifiedReviewReport {
  id: string;
  summary: string;
  categoryScores: CategoryScores;
  prioritizedIssues: AgentIssue[];
  recommendations: Recommendation[];
  strengths: string[];
  opportunities: string[];
  warnings: string[];
  confidence: number;
  metadata: {
    analyzedAt: string;
    durationMs: number;
    totalIssuesDetected: number;
    activeAgents: string[];
    platform: string;
    screenType: string;
  };
}

export interface IReviewAgent {
  name: string;
  category: string;
  run(screenModel: ScreenModel): Promise<AgentResponse>;
}
