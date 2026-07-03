/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { ScreenModel } from '../screen-understanding/screenModel';
import { UnifiedReviewReport, IReviewAgent } from './types';
import { 
  UXReviewAgent, 
  UIReviewAgent, 
  AccessibilityAgent, 
  VisualDesignAgent, 
  ProductDesignAgent, 
  MobileUXAgent 
} from './reviewAgent';
import { IReviewExecutionStrategy, ParallelExecutionStrategy } from './reviewPipeline';
import { ReviewMerger } from './reviewMerger';
import { ReviewValidator } from './reviewValidator';
import { ReviewPrioritizer } from './reviewPrioritizer';
import { RecommendationEngine } from './recommendationEngine';
import { ScoringEngine } from './scoringEngine';
import { ReviewReportBuilder } from './reviewReportBuilder';

export interface OrchestratorOptions {
  strategy?: IReviewExecutionStrategy;
  customReportId?: string;
}

export class ReviewOrchestrator {
  private agents: Map<string, IReviewAgent> = new Map();
  private aiClient?: GoogleGenAI;

  constructor(aiClient?: GoogleGenAI) {
    this.aiClient = aiClient;
    this.initializeDefaultAgents();
  }

  /**
   * Register default agents on initialization
   */
  private initializeDefaultAgents(): void {
    this.registerAgent(new UXReviewAgent(this.aiClient));
    this.registerAgent(new UIReviewAgent(this.aiClient));
    this.registerAgent(new AccessibilityAgent(this.aiClient));
    this.registerAgent(new VisualDesignAgent(this.aiClient));
    this.registerAgent(new ProductDesignAgent(this.aiClient));
    this.registerAgent(new MobileUXAgent(this.aiClient));
  }

  /**
   * Extensibility: Pluggable registration of new agents without changing core architecture
   */
  public registerAgent(agent: IReviewAgent): void {
    console.log(`[Review Orchestrator] Registering pluggable agent: "${agent.name}" (${agent.category})`);
    this.agents.set(agent.name, agent);
  }

  /**
   * Remove a registered agent
   */
  public unregisterAgent(agentName: string): boolean {
    return this.agents.delete(agentName);
  }

  /**
   * Get list of currently registered agent names
   */
  public getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Orchestrate the entire Multi-Agent AI Review Pipeline
   */
  public async orchestrate(screenModel: ScreenModel, options: OrchestratorOptions = {}): Promise<UnifiedReviewReport> {
    const totalStartTime = Date.now();
    console.log('[Review Orchestrator] Redesigning review system into Multi-Agent AI Engine');

    const strategy = options.strategy || new ParallelExecutionStrategy();
    const activeAgentsList = Array.from(this.agents.values());

    // 1. Run all review agents in parallel (or using strategy)
    const agentResponses = await strategy.execute(activeAgentsList, screenModel);

    // 2. Merge all agent responses (deduplicate and combine issues)
    const mergedIssues = ReviewMerger.merge(agentResponses);

    // 3. Validate coordinates, severities, confidence levels, and sanitize values
    const validatedIssues = ReviewValidator.validateAndSanitize(mergedIssues);

    // 4. Prioritize every issue based on composite impact and severities
    const prioritizedIssues = ReviewPrioritizer.prioritize(validatedIssues);

    // 5. Generate structured Quick Fixes, educational guidelines, and recommendations
    const recommendations = RecommendationEngine.generate(prioritizedIssues);

    // 6. Calculate all design category scores from final prioritized issues
    const categoryScores = ScoringEngine.calculate(prioritizedIssues);

    // 7. Assemble Unified Review Report using the Builder Pattern
    const durationMs = Date.now() - totalStartTime;
    
    // Extract screen characteristics for summary context
    const sType = screenModel.classification.screenType;
    const platform = screenModel.platform;
    const bulletSummary = `Multi-Agent audit of your ${platform} ${sType} completed in ${durationMs}ms with ${activeAgentsList.length} active review specialists.`;

    const builder = new ReviewReportBuilder()
      .setSummary(bulletSummary)
      .setCategoryScores(categoryScores)
      .setPrioritizedIssues(prioritizedIssues)
      .setRecommendations(recommendations)
      .setMetadata({
        analyzedAt: new Date().toISOString(),
        durationMs,
        activeAgents: activeAgentsList.map(a => a.name),
        platform,
        screenType: sType,
      });

    if (options.customReportId) {
      builder.setId(options.customReportId);
    }

    const report = builder.build();
    console.log('[Review Orchestrator] Unified Review Report successfully constructed!');
    return report;
  }
}
