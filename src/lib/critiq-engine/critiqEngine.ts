/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { ReviewWorkflow } from './reviewWorkflow';
import { ReviewProcessor } from './reviewProcessor';
import { CritiqReview } from './types';
import { ScreenModel } from '../screen-understanding/screenModel';

export class CritiqEngine {
  private aiClient?: GoogleGenAI;
  private workflow: ReviewWorkflow;

  constructor(aiClient?: GoogleGenAI) {
    this.aiClient = aiClient;
    this.workflow = new ReviewWorkflow(aiClient);
  }

  /**
   * Run complete visual heuristic design review on an uploaded mockup
   */
  public async reviewMockup(
    imageSrc: string,
    customPrompt?: string,
    customReviewId?: string,
    weightProfile?: any
  ): Promise<CritiqReview> {
    return this.workflow.execute(imageSrc, customPrompt, customReviewId, weightProfile);
  }

  /**
   * Facade for compiling raw findings directly (useful for local static data or fast replays)
   */
  public compileRawReview(
    rawIssues: any[],
    screenModel: ScreenModel,
    durationMs: number,
    customReviewId?: string,
    weightProfile?: any
  ): CritiqReview {
    return ReviewProcessor.process(rawIssues, screenModel, durationMs, customReviewId, weightProfile);
  }
}
