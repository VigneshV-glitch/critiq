/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { ScreenAnalyzer } from '../screen-understanding/screenAnalyzer';
import { ReviewOrchestrator } from '../review-engine/reviewOrchestrator';
import { ReviewProcessor } from './reviewProcessor';
import { CritiqReview } from './types';

export class ReviewWorkflow {
  private aiClient?: GoogleGenAI;
  private orchestrator: ReviewOrchestrator;

  constructor(aiClient?: GoogleGenAI) {
    this.aiClient = aiClient;
    this.orchestrator = new ReviewOrchestrator(aiClient);
  }

  /**
   * Run the complete visual review workflow from mockup image to a polished CritiqReview workspace object
   */
  public async execute(
    imageSrc: string,
    customPrompt?: string,
    customReviewId?: string,
    weightProfile?: any
  ): Promise<CritiqReview> {
    const startTime = Date.now();
    console.log('[Critiq Workflow] Starting professional visual review pipeline...');

    // 1. Analyze mockup to generate structured Screen Model (Phase 1)
    console.log('[Critiq Workflow] Running Screen Understanding Engine...');
    const screenModel = await ScreenAnalyzer.analyzeScreen(imageSrc, this.aiClient || null);

    // 2. Execute Multi-Agent Review Engine (Phase 2)
    console.log('[Critiq Workflow] Running Multi-Agent review inspectors...');
    const multiAgentReport = await this.orchestrator.orchestrate(screenModel, {
      customReportId: customReviewId
    });

    const durationMs = Date.now() - startTime;

    // 3. Normalize, classify, prioritize, and compute Design Health using the Critiq Review Processor
    console.log('[Critiq Workflow] Normalizing, classifying, and compiling final Critiq Review...');
    const critiqReview = ReviewProcessor.process(
      multiAgentReport.prioritizedIssues,
      screenModel,
      durationMs,
      customReviewId,
      weightProfile
    );

    console.log('[Critiq Workflow] Visual layout review compiled successfully.');
    return critiqReview;
  }
}
