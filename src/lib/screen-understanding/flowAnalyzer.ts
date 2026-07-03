/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserFlowStep } from './screenModel';

export class FlowAnalyzer {
  /**
   * Sanitizes and structure step-by-step user interaction sequence paths
   */
  public static processFlow(userFlow: any[]): UserFlowStep[] {
    if (!Array.isArray(userFlow)) {
      return [
        {
          sequence: 1,
          elementLabel: 'Main Screen',
          elementType: 'Screen',
          action: 'Landing on screen and scanning the header content'
        }
      ];
    }

    return userFlow.map((step, idx) => {
      const sequence = typeof step.sequence === 'number' ? step.sequence : idx + 1;
      const elementId = step.elementId || undefined;
      const elementLabel = String(step.elementLabel || `Step element ${idx + 1}`).trim();
      const elementType = String(step.elementType || 'interactive').trim();
      const action = String(step.action || 'view/tap element').trim();

      return {
        sequence,
        elementId,
        elementLabel,
        elementType,
        action,
      };
    });
  }
}
