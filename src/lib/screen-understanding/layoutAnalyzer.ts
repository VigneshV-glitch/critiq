/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDetails, ContainerModel } from './screenModel';

export class LayoutAnalyzer {
  /**
   * Cleans, sanitizes, and normalizes layout metrics and groupings
   */
  public static processLayout(layout: any): LayoutDetails {
    const rawContainers = Array.isArray(layout?.containers) ? layout.containers : [];

    const containers: ContainerModel[] = rawContainers.map((c: any, idx: number) => {
      const id = c.id || `container_${idx}_${Math.random().toString(36).substr(2, 4)}`;
      const name = c.name || `Section Container ${idx + 1}`;
      const type = c.type || 'Section';
      
      const rawBbox = c.boundingBox || {};
      const boundingBox = {
        x: typeof rawBbox.x === 'number' ? Math.max(0, Math.min(100, rawBbox.x)) : 0,
        y: typeof rawBbox.y === 'number' ? Math.max(0, Math.min(100, rawBbox.y)) : 0,
        width: typeof rawBbox.width === 'number' ? Math.max(1, Math.min(100, rawBbox.width)) : 20,
        height: typeof rawBbox.height === 'number' ? Math.max(1, Math.min(100, rawBbox.height)) : 20,
      };

      return {
        id,
        name,
        type,
        boundingBox,
        childrenIds: Array.isArray(c.childrenIds) ? c.childrenIds : [],
      };
    });

    const columns = typeof layout?.columns === 'number' ? Math.max(1, layout.columns) : 1;
    const gridStructure = layout?.gridStructure || 'Standard Fluid Row-Column layout';
    const alignment = ['left', 'center', 'right', 'justified', 'mixed'].includes(layout?.alignment)
      ? layout.alignment
      : 'left';
    const spacingPattern = layout?.spacingPattern || 'Standard (16px spacing)';
    
    const rawMargins = layout?.margins || {};
    const margins = {
      top: typeof rawMargins.top === 'number' ? rawMargins.top : 16,
      bottom: typeof rawMargins.bottom === 'number' ? rawMargins.bottom : 16,
      left: typeof rawMargins.left === 'number' ? rawMargins.left : 16,
      right: typeof rawMargins.right === 'number' ? rawMargins.right : 16,
    };

    const sections = Array.isArray(layout?.sections) ? layout.sections : ['Main Section'];
    const contentGrouping = layout?.contentGrouping || 'Stacked items grouping';

    return {
      columns,
      gridStructure,
      containers,
      alignment,
      spacingPattern,
      margins,
      sections,
      contentGrouping,
    };
  }
}
