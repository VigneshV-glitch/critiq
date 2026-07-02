/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Issue } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedIssue?: Issue;
}

export function validateIssue(issue: any): ValidationResult {
  const errors: string[] = [];

  // 1. Required fields check
  const requiredFields = ['category', 'ruleKey', 'title', 'description', 'severity', 'boundingBox', 'recommendation'];
  for (const field of requiredFields) {
    if (issue[field] === undefined || issue[field] === null || issue[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Early return if basic fields are missing
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate category
  if (issue.category !== 'UX_RULES' && issue.category !== 'UI_RULES') {
    errors.push(`Invalid category: ${issue.category}. Must be 'UX_RULES' or 'UI_RULES'`);
  }

  // 2. Severity check
  const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
  const normalizedSeverity = String(issue.severity).toLowerCase();
  if (!validSeverities.includes(normalizedSeverity)) {
    errors.push(`Invalid severity: ${issue.severity}. Must be one of ${validSeverities.join(', ')}`);
  }

  // 3. Bounding box check
  const bbox = issue.boundingBox;
  if (!bbox || typeof bbox !== 'object') {
    errors.push('boundingBox is missing or is not an object');
  } else {
    const coords = ['x', 'y', 'width', 'height'];
    for (const coord of coords) {
      if (typeof bbox[coord] !== 'number' || isNaN(bbox[coord])) {
        errors.push(`boundingBox.${coord} is not a valid number`);
      }
    }

    if (errors.length === 0) {
      const { x, y, width, height } = bbox;
      if (x < 0 || x > 100) errors.push(`boundingBox.x (${x}) must be between 0 and 100`);
      if (y < 0 || y > 100) errors.push(`boundingBox.y (${y}) must be between 0 and 100`);
      if (width < 0 || width > 100) errors.push(`boundingBox.width (${width}) must be between 0 and 100`);
      if (height < 0 || height > 100) errors.push(`boundingBox.height (${height}) must be between 0 and 100`);
      if (x + width > 110) { // allow a small margin for slight rounding/bounding issues
        errors.push(`boundingBox horizontal overflow: x + width (${x + width}) exceeds canvas limits`);
      }
      if (y + height > 110) {
        errors.push(`boundingBox vertical overflow: y + height (${y + height}) exceeds canvas limits`);
      }
    }
  }

  // 4. Confidence check
  // Default confidence to 100 if missing, otherwise validate range and ensure it meets minimum threshold of trust (e.g. 40%)
  let confidence = 100;
  if (issue.confidence !== undefined && issue.confidence !== null) {
    let parsedConf = Number(issue.confidence);
    // If confidence is represented as a decimal fraction between 0 and 1.0 (e.g. 0.92), normalize it to percentage (92)
    if (!isNaN(parsedConf) && parsedConf > 0 && parsedConf <= 1.0) {
      parsedConf = parsedConf * 100;
    }
    
    if (isNaN(parsedConf) || parsedConf < 0 || parsedConf > 100) {
      errors.push(`Invalid confidence: ${issue.confidence}. Must be a number between 0 and 100`);
    } else {
      confidence = parsedConf;
    }
  }

  // Reject issues with low confidence (< 40%) to ensure designers trust the output
  const MIN_CONFIDENCE = 40;
  if (confidence < MIN_CONFIDENCE) {
    errors.push(`Confidence (${confidence}) is below the required threshold of ${MIN_CONFIDENCE}`);
  }

  const isValid = errors.length === 0;

  let cleanedIssue: Issue | undefined = undefined;
  if (isValid) {
    cleanedIssue = {
      id: issue.id || `iss_${Math.random().toString(36).substr(2, 9)}`,
      category: issue.category,
      ruleKey: issue.ruleKey,
      title: issue.title,
      description: issue.description,
      severity: normalizedSeverity as any,
      boundingBox: {
        x: Math.max(0, Math.min(100, bbox.x)),
        y: Math.max(0, Math.min(100, bbox.y)),
        width: Math.max(1, Math.min(100, bbox.width)),
        height: Math.max(1, Math.min(100, bbox.height)),
      },
      recommendation: issue.recommendation,
      confidence: Math.round(confidence)
    };
  }

  return { isValid, errors, cleanedIssue };
}

export function validateAuditReport(report: any): { isValid: boolean; errors: string[]; cleanedIssues: Issue[] } {
  const errors: string[] = [];
  const cleanedIssues: Issue[] = [];

  if (!report || typeof report !== 'object') {
    return { isValid: false, errors: ['Report is not a valid object'], cleanedIssues: [] };
  }

  if (!Array.isArray(report.issues)) {
    return { isValid: false, errors: ['Report issues must be an array'], cleanedIssues: [] };
  }

  report.issues.forEach((issue: any, idx: number) => {
    const res = validateIssue(issue);
    if (res.isValid && res.cleanedIssue) {
      cleanedIssues.push(res.cleanedIssue);
    } else {
      errors.push(`Issue at index ${idx} failed validation: ${res.errors.join('; ')}`);
    }
  });

  // Overall report validation
  return {
    isValid: cleanedIssues.length > 0 || report.issues.length === 0,
    errors,
    cleanedIssues
  };
}
