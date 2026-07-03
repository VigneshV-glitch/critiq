/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CritiqReview, CritiqIssue } from './types';
import { ScreenModel } from '../screen-understanding/screenModel';
import { IssueNormalizer } from './issueNormalizer';
import { IssueClassifier } from './issueClassifier';
import { IssuePrioritizer } from './issuePrioritizer';
import { RecommendationBuilder } from './recommendationBuilder';
import { DesignHealthEngine } from './designHealthEngine';
import { ReviewSummaryBuilder } from './reviewSummaryBuilder';
import { ReviewMetadataGenerator } from './reviewMetadata';

export class ReviewProcessor {
  /**
   * Process raw multi-agent issues and compile them into a unified CritiqReview object
   */
  public static process(
    rawIssues: any[],
    screenModel: ScreenModel,
    analysisDurationMs: number,
    customId?: string
  ): CritiqReview {
    // 1. Normalize and merge duplicate issues
    const normalized = IssueNormalizer.normalizeAndMerge(rawIssues);

    // 2. Classify each merged issue into a formal category
    const classified = normalized.map(issue => {
      const category = IssueClassifier.classify(issue);
      return { ...issue, category };
    });

    // 3. Prioritize issues using multi-criteria weighted scoring
    const prioritized = IssuePrioritizer.prioritize(classified);

    // 4. Augment issues with educational guidelines and populate separate recommendations
    const recommendations = RecommendationBuilder.populateRecommendations(prioritized);

    // 5. Compute mean inspector confidence score
    const avgConfidence = prioritized.length > 0
      ? prioritized.reduce((sum, i) => sum + i.confidence, 0) / prioritized.length
      : 95;

    // 6. Calculate comprehensive Design Health scorecard
    const designHealth = DesignHealthEngine.calculate(prioritized, avgConfidence);

    // 7. Assemble professional executive summary (Critiq Platform Voice)
    const summary = ReviewSummaryBuilder.buildSummary(screenModel, prioritized);

    // 8. Generate consistent Critiq Review identity metadata
    const metadata = ReviewMetadataGenerator.generate(screenModel, analysisDurationMs, customId);

    return {
      id: metadata.reviewId,
      summary,
      designHealth,
      issues: prioritized,
      recommendations,
      metadata
    };
  }
}
