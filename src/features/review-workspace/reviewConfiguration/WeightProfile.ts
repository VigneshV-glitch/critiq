/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeightProfile } from './types';

export const COMPREHENSIVE_WEIGHTS: WeightProfile = {
  accessibility: 25,
  usability: 25,
  visualDesign: 20,
  designSystem: 15,
  interaction: 10,
  enterpriseUX: 5,
  mobileUX: 0,
  performance: 0,
  conversion: 0,
  content: 0,
  navigation: 0,
};

export const WCAG_ACCESSIBILITY_WEIGHTS: WeightProfile = {
  accessibility: 60,
  usability: 15,
  visualDesign: 10,
  interaction: 10,
  designSystem: 5,
  enterpriseUX: 0,
  mobileUX: 0,
  performance: 0,
  conversion: 0,
  content: 0,
  navigation: 0,
};

export const NIELSEN_USABILITY_WEIGHTS: WeightProfile = {
  accessibility: 5,
  usability: 50,
  visualDesign: 0,
  interaction: 20,
  designSystem: 0,
  enterpriseUX: 0,
  mobileUX: 0,
  performance: 0,
  conversion: 0,
  content: 10,
  navigation: 15,
};

export const ENTERPRISE_UX_WEIGHTS: WeightProfile = {
  accessibility: 15,
  usability: 25,
  visualDesign: 10,
  interaction: 0,
  designSystem: 5,
  enterpriseUX: 45,
  mobileUX: 0,
  performance: 0,
  conversion: 0,
  content: 0,
  navigation: 0,
};

export const MOBILE_UX_WEIGHTS: WeightProfile = {
  accessibility: 15,
  usability: 20,
  visualDesign: 0,
  interaction: 15,
  designSystem: 0,
  enterpriseUX: 0,
  mobileUX: 40,
  performance: 0,
  conversion: 0,
  content: 0,
  navigation: 10,
};

export const DESIGN_SYSTEM_WEIGHTS: WeightProfile = {
  accessibility: 0,
  usability: 15,
  visualDesign: 25,
  interaction: 0,
  designSystem: 45,
  enterpriseUX: 0,
  mobileUX: 0,
  performance: 15, // Using performance to represent visual spacing tolerances
  conversion: 0,
  content: 0,
  navigation: 0,
};

/**
 * Get weight profile by methodology ID
 */
export function getWeightProfileForMethodology(id: string): WeightProfile {
  switch (id) {
    case 'wcag-accessibility':
      return WCAG_ACCESSIBILITY_WEIGHTS;
    case 'nielsen-usability':
      return NIELSEN_USABILITY_WEIGHTS;
    case 'enterprise-ux':
      return ENTERPRISE_UX_WEIGHTS;
    case 'mobile-ux':
      return MOBILE_UX_WEIGHTS;
    case 'design-system':
      return DESIGN_SYSTEM_WEIGHTS;
    case 'comprehensive-critiq':
    default:
      return COMPREHENSIVE_WEIGHTS;
  }
}
