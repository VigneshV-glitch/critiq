/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundingBox } from '../../types';

export enum ScreenType {
  LOGIN = 'Login',
  REGISTRATION = 'Registration',
  DASHBOARD = 'Dashboard',
  LANDING_PAGE = 'Landing Page',
  CHECKOUT = 'Checkout',
  SETTINGS = 'Settings',
  PROFILE = 'Profile',
  ANALYTICS = 'Analytics',
  PRODUCT_LISTING = 'Product Listing',
  PRODUCT_DETAIL = 'Product Detail',
  FORM = 'Form',
  WIZARD = 'Wizard',
  MODAL = 'Modal',
  DIALOG = 'Dialog',
  MOBILE_SCREEN = 'Mobile Screen',
  DESKTOP_SCREEN = 'Desktop Screen',
  TABLET_SCREEN = 'Tablet Screen',
  UNKNOWN = 'Unknown',
}

export enum PlatformType {
  WEB = 'Web',
  MOBILE = 'Mobile',
  TABLET = 'Tablet',
  DESKTOP = 'Desktop',
  RESPONSIVE = 'Responsive',
}

export enum DesignSystemType {
  MATERIAL_DESIGN = 'Material Design',
  FLUENT = 'Fluent',
  HUMAN_INTERFACE_GUIDELINES = 'Human Interface Guidelines',
  BOOTSTRAP = 'Bootstrap',
  ANT_DESIGN = 'Ant Design',
  CUSTOM = 'Custom Design System',
  UNKNOWN = 'Unknown',
}

export interface DetectedComponent {
  id: string;
  type: string; // e.g. Logo, Header, Button, Text Field, Checkbox, etc.
  boundingBox: BoundingBox;
  confidence: number; // 0 to 100
  parentContainerId?: string;
  childComponentIds?: string[];
}

export interface ContainerModel {
  id: string;
  name: string;
  type: string; // e.g. Card, Section, Grid Cell, Modal Wrapper
  boundingBox: BoundingBox;
  childrenIds: string[];
}

export interface LayoutDetails {
  columns: number;
  gridStructure: string;
  containers: ContainerModel[];
  alignment: 'left' | 'center' | 'right' | 'justified' | 'mixed';
  spacingPattern: string; // e.g. "Tight (4-8px)", "Standard (16px)", "Generous (24px+)"
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sections: string[];
  contentGrouping: string; // Description of clustered elements
}

export interface VisualHierarchyDetails {
  primaryCTA?: string; // Component ID or label
  secondaryCTA?: string[]; // Component IDs or labels
  mostProminentElement: string;
  readingOrder: string[]; // Sequential list of sections/elements read
  visualFlow: 'F-Shape' | 'Z-Shape' | 'Single Column' | 'Grid Flow' | 'Mixed';
  attentionHotspots: Array<{
    area: string;
    intensity: 'high' | 'medium' | 'low';
    boundingBox: BoundingBox;
  }>;
  hierarchyScore: number; // 0 to 100
}

export interface UserFlowStep {
  sequence: number;
  elementId?: string;
  elementLabel: string;
  elementType: string;
  action: string; // e.g. "Input Email", "Click Login Button"
}

export interface ScreenMetadata {
  screenName: string;
  purpose: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  businessDomain: string; // e.g. Fintech, E-Commerce, SaaS, Health
  industry: string;
  targetUsers: string;
  estimatedUserGoal: string;
}

export interface DesignSystemDetails {
  detectedSystem: DesignSystemType;
  confidence: number; // 0 to 100
}

export interface ConfidenceScores {
  classification: number;
  components: number;
  layout: number;
  hierarchy: number;
  global: number;
}

export interface ScreenModel {
  metadata: ScreenMetadata;
  classification: {
    screenType: ScreenType;
    confidence: number;
  };
  platform: PlatformType;
  layout: LayoutDetails;
  components: DetectedComponent[];
  containers: ContainerModel[];
  hierarchy: VisualHierarchyDetails;
  navigation: {
    hasPersistentNav: boolean;
    navType: 'top' | 'sidebar' | 'footer' | 'hamburger' | 'none';
    navElements: string[];
  };
  userFlow: UserFlowStep[];
  designSystem: DesignSystemDetails;
  detectedIssues: []; // Excluded for Phase 1 / empty by default
  reviewResults: [];  // Excluded for Phase 1 / empty by default
  confidenceScores: ConfidenceScores;
  timestamp: string;
  version: string; // "2.0.0"
}
