/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqReviewMetadata } from './types';
import { ScreenModel } from '../screen-understanding/screenModel';

export class ReviewMetadataGenerator {
  public static generate(
    screenModel: ScreenModel,
    analysisDurationMs: number,
    customId?: string
  ): CritiqReviewMetadata {
    const sType = screenModel.classification?.screenType || 'Dashboard';
    const platform = screenModel.platform || 'Web';
    
    // Extract component types for the metadata summary
    const detectedComponents = screenModel.components?.map(c => c.type) || [];
    const uniqueComponents = Array.from(new Set(detectedComponents));

    return {
      reviewId: customId || `review_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      reviewDate: new Date().toISOString(),
      screenType: sType,
      platform,
      detectedComponents: uniqueComponents.length > 0 ? uniqueComponents : ['Container', 'Text', 'Input'],
      analysisDurationMs,
      reviewVersion: '2.0.0',
      methodologyVersion: 'Critiq-V2-Heuristics',
      confidence: screenModel.classification?.confidence || 92
    };
  }
}
