/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewType, Issue, AuditReport, Severity, Rule } from '../types';

export abstract class AIProvider {
  abstract name: string;
  abstract analyzeDesign(
    imageSrc: string, // Base64 or mock identifier
    rules: Rule[],
    reviewType: ReviewType,
    customPrompt?: string
  ): Promise<Partial<AuditReport>>;
}

export class GeminiProvider extends AIProvider {
  name = 'Gemini 3.5 Flash / Pro';

  async analyzeDesign(
    imageSrc: string,
    rules: Rule[],
    reviewType: ReviewType,
    customPrompt?: string
  ): Promise<Partial<AuditReport>> {
    try {
      const response = await fetch('/api/critiq/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageSrc,
          rules,
          reviewType,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to audit: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Gemini Provider backend error, falling back dynamically...', err);
      throw err;
    }
  }
}

export class ClaudeProvider extends AIProvider {
  name = 'Claude 3.5 Sonnet / Opus';

  async analyzeDesign(
    imageSrc: string,
    rules: Rule[],
    reviewType: ReviewType,
    customPrompt?: string
  ): Promise<Partial<AuditReport>> {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {
      score: 78,
      severity: Severity.MEDIUM,
      reviewType: reviewType,
      summary: "[Claude Simulation - Heuristics Mode] General heuristics check completed. Verified text readability & contrast ratio.",
      issues: [
        {
          id: 'iss_claude_01',
          category: 'UI_RULES',
          ruleKey: 'visual_hierarchy',
          title: 'Claude Audit: Subheading typography contrast gap',
          description: 'The typography scale is compressed. Font weight contrast is too low to differentiate sections.',
          severity: 'medium',
          boundingBox: { x: 10, y: 25, width: 80, height: 10 },
          recommendation: 'Double font weight of heading or reduce secondary label sizes.'
        }
      ],
      recommendations: ['Enforce crisp dark dividers', 'Consolidate primary text contrast rules.']
    };
  }
}

export class ChatGPTProvider extends AIProvider {
  name = 'GPT-4o Vision Engine';

  async analyzeDesign(
    imageSrc: string,
    rules: Rule[],
    reviewType: ReviewType,
    customPrompt?: string
  ): Promise<Partial<AuditReport>> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      score: 80,
      severity: Severity.MEDIUM,
      reviewType: reviewType,
      summary: "[GPT-4o Simulation - Heuristics Mode] Screen checked against universal layout aesthetics.",
      issues: [
        {
          id: 'iss_gpt_01',
          category: 'UI_RULES',
          ruleKey: 'alignment_precision',
          title: 'GPT Audit: Icon baseline mismatch',
          description: 'Vector graphics inside transaction logs do not sit cleanly on the baseline.',
          severity: 'low',
          boundingBox: { x: 8, y: 55, width: 12, height: 8 },
          recommendation: 'Add alignment flex-items-center classes or baseline offset properties.'
        }
      ],
      recommendations: ['Utilize standard icon sizes of 20px', 'Enforce uniform layout alignment.']
    };
  }
}
