/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox } from '../../types';

export enum IssueCategory {
  NAVIGATION = 'Navigation',
  LAYOUT = 'Layout',
  TYPOGRAPHY = 'Typography',
  COLOR = 'Color',
  CONTRAST = 'Contrast',
  SPACING = 'Spacing',
  ALIGNMENT = 'Alignment',
  FORMS = 'Forms',
  BUTTONS = 'Buttons',
  ACCESSIBILITY = 'Accessibility',
  INTERACTION = 'Interaction',
  VISUAL_HIERARCHY = 'Visual Hierarchy',
  CONTENT = 'Content',
  CONSISTENCY = 'Consistency',
  PERFORMANCE = 'Performance',
  DESIGN_SYSTEM = 'Design System',
  MOBILE_UX = 'Mobile UX',
  ENTERPRISE_UX = 'Enterprise UX',
  UNKNOWN = 'Unknown'
}

export enum IssueSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface ImpactScores {
  businessImpact: number; // 0 - 100
  userImpact: number; // 0 - 100
  accessibilityImpact: number; // 0 - 100
}

export interface CritiqIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  confidence: number; // 0 - 100
  title: string;
  description: string;
  boundingBox: BoundingBox;
  evidence: string[]; // List of reporting agent logs/evidences
  
  // Priority calculation metrics
  businessImpact: 'High' | 'Medium' | 'Low';
  userImpact: 'High' | 'Medium' | 'Low';
  accessibilityImpact: 'High' | 'Medium' | 'Low';
  estimatedFixComplexity: 'High' | 'Medium' | 'Low';
  estimatedFixTime: string; // e.g., "15 mins", "1 hour"
  priorityScore: number; // Composite score for sorting
  
  // Educational & Actionable Details (from Recommendation Engine)
  problem: string;
  whyItMatters: string;
  rootCause: string;
  quickFix: string;
  recommendedSolution: string;
  bestPractice: string;
  uxPrinciple: string;
  accessibilityGuideline: string;
  expectedImprovement: string;
  learningNotes: string;
}

export interface ScoreDetail {
  score: number; // 30 - 100
  explanation: string;
}

export interface DesignHealth {
  overallDesignHealth: ScoreDetail;
  uxHealth: ScoreDetail;
  uiHealth: ScoreDetail;
  accessibilityHealth: ScoreDetail;
  visualDesignHealth: ScoreDetail;
  interactionHealth: ScoreDetail;
  contentHealth: ScoreDetail;
  mobileHealth: ScoreDetail;
  enterpriseReadiness: ScoreDetail;
  confidenceScore: ScoreDetail;
}

export interface CritiqRecommendation {
  issueId: string;
  problem: string;
  whyItMatters: string;
  quickFix: string;
  recommendedSolution: string;
  bestPractice: string;
  uxPrinciple: string;
  expectedImprovement: string;
}

export interface CritiqReviewMetadata {
  reviewId: string;
  reviewDate: string;
  screenType: string;
  platform: string;
  detectedComponents: string[];
  analysisDurationMs: number;
  reviewVersion: string;
  methodologyVersion: string;
  confidence: number;
}

export interface CritiqReview {
  id: string;
  summary: string;
  designHealth: DesignHealth;
  issues: CritiqIssue[];
  recommendations: CritiqRecommendation[];
  metadata: CritiqReviewMetadata;
}
