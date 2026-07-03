/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenModel } from '../screen-understanding/screenModel';
import { AgentResponse, IReviewAgent } from './types';

/**
 * Strategy Pattern Interface for Multi-Agent Review Execution
 */
export interface IReviewExecutionStrategy {
  execute(agents: IReviewAgent[], screenModel: ScreenModel): Promise<AgentResponse[]>;
}

/**
 * Strategy 1: Parallel Execution Strategy (runs all agents in parallel with retry mechanisms)
 */
export class ParallelExecutionStrategy implements IReviewExecutionStrategy {
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(maxRetries = 2, retryDelayMs = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  public async execute(agents: IReviewAgent[], screenModel: ScreenModel): Promise<AgentResponse[]> {
    console.log(`[Review Pipeline] Running ${agents.length} agents in Parallel...`);

    const promises = agents.map(agent => this.runAgentWithRetry(agent, screenModel));
    return Promise.all(promises);
  }

  private async runAgentWithRetry(agent: IReviewAgent, screenModel: ScreenModel, attempt = 1): Promise<AgentResponse> {
    const startTime = Date.now();
    try {
      return await agent.run(screenModel);
    } catch (error) {
      console.error(`[Review Pipeline] Agent "${agent.name}" failed on attempt ${attempt}/${this.maxRetries + 1}:`, error);
      
      if (attempt <= this.maxRetries) {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`[Review Pipeline] Retrying agent "${agent.name}" in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.runAgentWithRetry(agent, screenModel, attempt + 1);
      }
      
      // If all retries fail, return a safe mock error response so the pipeline continues
      console.error(`[Review Pipeline] Agent "${agent.name}" failed permanently.`);
      return {
        agentName: agent.name,
        category: agent.category,
        summary: `Error: Evaluation could not complete.`,
        detectedIssues: [],
      };
    }
  }
}

/**
 * Strategy 2: Sequential Execution Strategy (useful for debugging, rate-limit mitigation, or serial chains)
 */
export class SequentialExecutionStrategy implements IReviewExecutionStrategy {
  public async execute(agents: IReviewAgent[], screenModel: ScreenModel): Promise<AgentResponse[]> {
    console.log(`[Review Pipeline] Running ${agents.length} agents Sequentially...`);
    const responses: AgentResponse[] = [];

    for (const agent of agents) {
      try {
        const res = await agent.run(screenModel);
        responses.push(res);
      } catch (error) {
        console.error(`[Review Pipeline] Sequential Agent "${agent.name}" failed:`, error);
        responses.push({
          agentName: agent.name,
          category: agent.category,
          summary: `Error: Sequential execution failed.`,
          detectedIssues: [],
        });
      }
    }

    return responses;
  }
}
