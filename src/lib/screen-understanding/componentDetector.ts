/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetectedComponent } from './screenModel';

export class ComponentDetector {
  /**
   * Cleans and sanitizes a list of detected components, ensuring correct coordinate properties
   */
  public static sanitizeComponents(components: any[]): DetectedComponent[] {
    if (!Array.isArray(components)) return [];

    return components.map((comp, idx) => {
      const id = comp.id || `comp_${idx}_${Math.random().toString(36).substr(2, 4)}`;
      const type = String(comp.type || 'Unknown').trim();
      
      const rawBbox = comp.boundingBox || {};
      const boundingBox = {
        x: typeof rawBbox.x === 'number' ? Math.max(0, Math.min(100, rawBbox.x)) : 0,
        y: typeof rawBbox.y === 'number' ? Math.max(0, Math.min(100, rawBbox.y)) : 0,
        width: typeof rawBbox.width === 'number' ? Math.max(1, Math.min(100, rawBbox.width)) : 10,
        height: typeof rawBbox.height === 'number' ? Math.max(1, Math.min(100, rawBbox.height)) : 10,
      };

      const confidence = typeof comp.confidence === 'number' ? Math.max(0, Math.min(100, comp.confidence)) : 90;

      return {
        id,
        type,
        boundingBox,
        confidence,
        parentContainerId: comp.parentContainerId,
        childComponentIds: Array.isArray(comp.childComponentIds) ? comp.childComponentIds : [],
      };
    });
  }

  /**
   * Groups child components under their parent containers based on coordinate bounding box inclusion
   */
  public static associateParentChild(components: DetectedComponent[]): DetectedComponent[] {
    // If childComponentIds or parentContainerId is not set, we can auto-resolve them
    // by checking if smaller bounding boxes reside entirely inside larger container elements.
    const resolved = [...components];

    for (let i = 0; i < resolved.length; i++) {
      const parent = resolved[i];
      // Only treat large elements or containers (e.g. Card, Section, Modal, Grid) as parent containers
      const parentType = parent.type.toLowerCase();
      const isLikelyContainer = parentType.includes('card') || 
                                 parentType.includes('section') || 
                                 parentType.includes('modal') || 
                                 parentType.includes('dialog') || 
                                 parentType.includes('group') || 
                                 parentType.includes('container') || 
                                 parentType.includes('header') || 
                                 parentType.includes('footer') || 
                                 parentType.includes('sidebar');

      if (!isLikelyContainer) continue;

      const pBox = parent.boundingBox;
      const childIds: string[] = parent.childComponentIds ? [...parent.childComponentIds] : [];

      for (let j = 0; j < resolved.length; j++) {
        if (i === j) continue;
        const child = resolved[j];
        const cBox = child.boundingBox;

        // Check bounding box inclusion: child is inside parent
        const isContained = cBox.x >= pBox.x &&
                            cBox.y >= pBox.y &&
                            (cBox.x + cBox.width) <= (pBox.x + pBox.width) &&
                            (cBox.y + cBox.height) <= (pBox.y + pBox.height);

        // Make sure child isn't larger than parent and is indeed a child element
        if (isContained && (cBox.width * cBox.height) < (pBox.width * pBox.height)) {
          if (!child.parentContainerId) {
            child.parentContainerId = parent.id;
          }
          if (!childIds.includes(child.id)) {
            childIds.push(child.id);
          }
        }
      }
      parent.childComponentIds = childIds;
    }

    return resolved;
  }
}
