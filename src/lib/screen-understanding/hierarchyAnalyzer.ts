/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualHierarchyDetails } from './screenModel';

export class HierarchyAnalyzer {
  /**
   * Cleans and sanitizes the hierarchy and hotspot information
   */
  public static processHierarchy(hierarchy: any): VisualHierarchyDetails {
    const primaryCTA = hierarchy?.primaryCTA || undefined;
    const secondaryCTA = Array.isArray(hierarchy?.secondaryCTA) ? hierarchy.secondaryCTA : [];
    const mostProminentElement = hierarchy?.mostProminentElement || 'Main Header Title';
    const readingOrder = Array.isArray(hierarchy?.readingOrder) ? hierarchy.readingOrder : ['Header', 'Body text', 'Footer'];
    
    const flowOptions = ['F-Shape', 'Z-Shape', 'Single Column', 'Grid Flow', 'Mixed'];
    const visualFlow = flowOptions.includes(hierarchy?.visualFlow) ? hierarchy.visualFlow : 'F-Shape';

    const rawSpots = Array.isArray(hierarchy?.attentionHotspots) ? hierarchy.attentionHotspots : [];
    const attentionHotspots = rawSpots.map((spot: any, idx: number) => {
      const area = spot.area || `Hotspot Area ${idx + 1}`;
      const intensity = ['high', 'medium', 'low'].includes(spot.intensity) ? spot.intensity : 'medium';
      
      const rawBbox = spot.boundingBox || {};
      const boundingBox = {
        x: typeof rawBbox.x === 'number' ? Math.max(0, Math.min(100, rawBbox.x)) : 10,
        y: typeof rawBbox.y === 'number' ? Math.max(0, Math.min(100, rawBbox.y)) : 10,
        width: typeof rawBbox.width === 'number' ? Math.max(1, Math.min(100, rawBbox.width)) : 15,
        height: typeof rawBbox.height === 'number' ? Math.max(1, Math.min(100, rawBbox.height)) : 15,
      };

      return {
        area,
        intensity,
        boundingBox,
      };
    });

    const hierarchyScore = typeof hierarchy?.hierarchyScore === 'number' ? Math.max(0, Math.min(100, hierarchy.hierarchyScore)) : 80;

    return {
      primaryCTA,
      secondaryCTA,
      mostProminentElement,
      readingOrder,
      visualFlow,
      attentionHotspots,
      hierarchyScore,
    };
  }
}
