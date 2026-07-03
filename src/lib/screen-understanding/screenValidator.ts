/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenModel } from './screenModel';

export interface ValidationError {
  field: string;
  message: string;
}

export class ScreenValidator {
  /**
   * Validates a complete ScreenModel instance
   */
  public static validate(model: any): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!model || typeof model !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'root', message: 'Model is not a valid object' }],
      };
    }

    // 1. Check top-level required fields
    const requiredTopFields = [
      'metadata',
      'classification',
      'platform',
      'layout',
      'components',
      'containers',
      'hierarchy',
      'navigation',
      'userFlow',
      'designSystem',
      'confidenceScores',
    ];

    for (const field of requiredTopFields) {
      if (!(field in model)) {
        errors.push({ field, message: `Missing required top-level field: "${field}"` });
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 2. Validate Metadata
    const meta = model.metadata;
    if (!meta || typeof meta !== 'object') {
      errors.push({ field: 'metadata', message: 'Metadata must be a valid object' });
    } else {
      if (!meta.screenName) errors.push({ field: 'metadata.screenName', message: 'Screen name is missing' });
      if (!meta.purpose) errors.push({ field: 'metadata.purpose', message: 'Screen purpose is missing' });
      if (!['low', 'medium', 'high'].includes(meta.estimatedComplexity)) {
        errors.push({ field: 'metadata.estimatedComplexity', message: 'Invalid estimated complexity' });
      }
    }

    // 3. Validate Classification
    const cls = model.classification;
    if (!cls || typeof cls !== 'object') {
      errors.push({ field: 'classification', message: 'Classification must be a valid object' });
    } else {
      if (!cls.screenType) errors.push({ field: 'classification.screenType', message: 'Screen type is missing' });
      if (typeof cls.confidence !== 'number' || cls.confidence < 0 || cls.confidence > 100) {
        errors.push({ field: 'classification.confidence', message: 'Classification confidence must be between 0 and 100' });
      }
    }

    // 4. Validate Components (and coordinate checks)
    const comps = model.components;
    if (!Array.isArray(comps)) {
      errors.push({ field: 'components', message: 'Components must be an array' });
    } else {
      const compIds = new Set<string>();
      comps.forEach((comp: any, idx: number) => {
        const prefix = `components[${idx}]`;
        if (!comp || typeof comp !== 'object') {
          errors.push({ field: prefix, message: 'Component is not an object' });
          return;
        }

        if (!comp.id) {
          errors.push({ field: `${prefix}.id`, message: 'Component ID is missing' });
        } else {
          if (compIds.has(comp.id)) {
            errors.push({ field: `${prefix}.id`, message: `Duplicate component ID found: "${comp.id}"` });
          }
          compIds.add(comp.id);
        }

        if (!comp.type) {
          errors.push({ field: `${prefix}.type`, message: 'Component type is missing' });
        }

        if (typeof comp.confidence !== 'number' || comp.confidence < 0 || comp.confidence > 100) {
          errors.push({ field: `${prefix}.confidence`, message: 'Component confidence must be between 0 and 100' });
        }

        // Coordinate checks
        const bbox = comp.boundingBox;
        if (!bbox || typeof bbox !== 'object') {
          errors.push({ field: `${prefix}.boundingBox`, message: 'Bounding box is missing' });
        } else {
          this.validateBoundingBox(bbox, `${prefix}.boundingBox`, errors);
        }
      });

      // Check for exact identical bounding boxes (duplicate visual overlap within tolerance)
      for (let i = 0; i < comps.length; i++) {
        for (let j = i + 1; j < comps.length; j++) {
          const b1 = comps[i]?.boundingBox;
          const b2 = comps[j]?.boundingBox;
          if (b1 && b2) {
            const dx = Math.abs(b1.x - b2.x);
            const dy = Math.abs(b1.y - b2.y);
            const dw = Math.abs(b1.width - b2.width);
            const dh = Math.abs(b1.height - b2.height);
            // If they match within 0.01% on all parameters, raise error
            if (dx < 0.01 && dy < 0.01 && dw < 0.01 && dh < 0.01) {
              errors.push({
                field: `components`,
                message: `Duplicate component geometry: "${comps[i].id}" and "${comps[j].id}" overlap exactly.`,
              });
            }
          }
        }
      }
    }

    // 5. Validate Containers (Overlapping Hierarchy)
    const conts = model.containers;
    if (!Array.isArray(conts)) {
      errors.push({ field: 'containers', message: 'Containers must be an array' });
    } else {
      conts.forEach((cont: any, idx: number) => {
        const prefix = `containers[${idx}]`;
        if (!cont || typeof cont !== 'object') {
          errors.push({ field: prefix, message: 'Container is not an object' });
          return;
        }

        if (!cont.id) {
          errors.push({ field: `${prefix}.id`, message: 'Container ID is missing' });
        }

        if (!cont.type) {
          errors.push({ field: `${prefix}.type`, message: 'Container type is missing' });
        }

        const bbox = cont.boundingBox;
        if (!bbox || typeof bbox !== 'object') {
          errors.push({ field: `${prefix}.boundingBox`, message: 'Bounding box is missing' });
        } else {
          this.validateBoundingBox(bbox, `${prefix}.boundingBox`, errors);
        }

        if (Array.isArray(cont.childrenIds)) {
          // Verify that child component/container IDs listed actually exist in components or containers
          cont.childrenIds.forEach((childId: string) => {
            const childExists =
              comps?.some((c: any) => c.id === childId) ||
              conts.some((c: any) => c.id === childId);
            if (!childExists) {
              errors.push({
                field: `${prefix}.childrenIds`,
                message: `Container refers to non-existent child ID: "${childId}"`,
              });
            }
          });
        }
      });
    }

    // 6. Validate Visual Hierarchy
    const hier = model.hierarchy;
    if (!hier || typeof hier !== 'object') {
      errors.push({ field: 'hierarchy', message: 'Hierarchy must be a valid object' });
    } else {
      if (typeof hier.hierarchyScore !== 'number' || hier.hierarchyScore < 0 || hier.hierarchyScore > 100) {
        errors.push({ field: 'hierarchy.hierarchyScore', message: 'Hierarchy score must be between 0 and 100' });
      }

      if (Array.isArray(hier.attentionHotspots)) {
        hier.attentionHotspots.forEach((spot: any, idx: number) => {
          const prefix = `hierarchy.attentionHotspots[${idx}]`;
          if (!spot.area) errors.push({ field: `${prefix}.area`, message: 'Area description is missing' });
          if (!['high', 'medium', 'low'].includes(spot.intensity)) {
            errors.push({ field: `${prefix}.intensity`, message: 'Attention intensity must be high, medium, or low' });
          }
          if (spot.boundingBox) {
            this.validateBoundingBox(spot.boundingBox, `${prefix}.boundingBox`, errors);
          } else {
            errors.push({ field: `${prefix}.boundingBox`, message: 'Attention hotspot bounding box is missing' });
          }
        });
      }
    }

    // 7. Validate Confidence Scores
    const confs = model.confidenceScores;
    if (!confs || typeof confs !== 'object') {
      errors.push({ field: 'confidenceScores', message: 'Confidence scores must be an object' });
    } else {
      const keys = ['classification', 'components', 'layout', 'hierarchy', 'global'];
      for (const k of keys) {
        const val = confs[k];
        if (typeof val !== 'number' || val < 0 || val > 100) {
          errors.push({ field: `confidenceScores.${k}`, message: `Confidence score for "${k}" must be between 0 and 100` });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateBoundingBox(bbox: any, fieldPath: string, errors: ValidationError[]): void {
    const { x, y, width, height } = bbox;
    if (typeof x !== 'number' || x < 0 || x > 100) {
      errors.push({ field: `${fieldPath}.x`, message: `X coordinate must be a percentage between 0 and 100 (got ${x})` });
    }
    if (typeof y !== 'number' || y < 0 || y > 100) {
      errors.push({ field: `${fieldPath}.y`, message: `Y coordinate must be a percentage between 0 and 100 (got ${y})` });
    }
    if (typeof width !== 'number' || width <= 0 || width > 100) {
      errors.push({ field: `${fieldPath}.width`, message: `Width must be a positive percentage up to 100 (got ${width})` });
    }
    if (typeof height !== 'number' || height <= 0 || height > 100) {
      errors.push({ field: `${fieldPath}.height`, message: `Height must be a positive percentage up to 100 (got ${height})` });
    }
  }
}
