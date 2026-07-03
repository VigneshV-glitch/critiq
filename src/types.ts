/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenModel } from './lib/screen-understanding/screenModel';

export enum ReviewType {
  UX_HEURISTICS = 'UX_HEURISTICS',
  UI_GUIDELINES = 'UI_GUIDELINES',
  FULL_AUDIT = 'FULL_AUDIT',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  INFO = 'info',
}

export interface BoundingBox {
  x: number; // Percentage from left (0 - 100)
  y: number; // Percentage from top (0 - 100)
  width: number; // Width percentage
  height: number; // Height percentage
}

export interface Issue {
  id: string;
  category: 'UX_RULES' | 'UI_RULES';
  ruleKey: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  boundingBox: BoundingBox;
  recommendation: string;
  confidence?: number; // Confidence score (0-100)
}

export interface AuditReport {
  id: string;
  projectId: string;
  name: string;
  imageUrl: string;
  reviewType: ReviewType;
  score: number; // 0 to 100
  severity: Severity;
  summary: string;
  issues: Issue[];
  recommendations: string[];
  createdAt: string;
  isUnavailable?: boolean;
  visualObservationSummary?: any;
  screenModel?: ScreenModel;
  scoreBreakdown?: {
    visualDesign: number;
    usability: number;
    accessibility: number;
    consistency: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  reviewsCount: number;
}

export interface Rule {
  key: string;
  title: string;
  description: string;
  category: 'UX_RULES' | 'UI_RULES';
  enabled: boolean;
  weight: number; // 1 to 5
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
