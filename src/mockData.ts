/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, AuditReport, Rule, ReviewType, Severity } from './types';

export const initialProjects: Project[] = [
  {
    id: 'proj_fintech',
    name: 'Fintech Mobile App v2',
    description: 'Neobank app mockup focusing on modern card layouts, transfer flows, and high contrast analytics dashboard.',
    createdAt: '2026-06-25T14:30:00Z',
    updatedAt: '2026-06-29T21:00:00Z',
    reviewsCount: 3,
  },
  {
    id: 'proj_ecommerce',
    name: 'E-Commerce Checkout Screen',
    description: 'Conversion-optimized desktop checkout checkout step 1 with cart summary, shipping form, and primary payment action.',
    createdAt: '2026-06-26T09:15:00Z',
    updatedAt: '2026-06-28T11:45:00Z',
    reviewsCount: 2,
  },
  {
    id: 'proj_portfolio',
    name: 'Minimal Portfolio Landing',
    description: 'Bento-grid showcase for digital artist with heavy typography scale, hover overlays, and micro-animations.',
    createdAt: '2026-06-28T18:22:00Z',
    updatedAt: '2026-06-28T18:30:00Z',
    reviewsCount: 1,
  }
];

export const initialRules: Rule[] = [
  // UX Rules
  {
    key: 'nielsen_consistency',
    title: 'Consistency and standards',
    description: 'Ensure layout buttons and controls align with standard web paradigms (e.g., destructive actions in red).',
    category: 'UX_RULES',
    enabled: true,
    weight: 4,
  },
  {
    key: 'nielsen_status',
    title: 'Visibility of system status',
    description: 'Provide immediate active feedback on user actions (loading, progress, completed overlays).',
    category: 'UX_RULES',
    enabled: true,
    weight: 5,
  },
  {
    key: 'hicks_law',
    title: "Hick's Law - Choice Overload",
    description: 'Keep option counts minimum. Group actions into logical categories to prevent decision paralysis.',
    category: 'UX_RULES',
    enabled: true,
    weight: 3,
  },
  {
    key: 'fittss_law',
    title: "Fitts's Law - Target Sizes",
    description: 'Buttons and touch targets must be at least 44px on mobile and clearly separated to prevent misclicks.',
    category: 'UX_RULES',
    enabled: true,
    weight: 5,
  },
  {
    key: 'cognitive_load',
    title: 'Cognitive Load Reduction',
    description: 'Avoid unnecessary visual decoration. Remove repetitive labels or heavily nested outline containers.',
    category: 'UX_RULES',
    enabled: true,
    weight: 4,
  },
  
  // UI Rules
  {
    key: 'visual_hierarchy',
    title: 'Visual Hierarchy & Focus Flow',
    description: 'Contrast font-weight, color contrast, and scale to guide the eye from the most critical action downward.',
    category: 'UI_RULES',
    enabled: true,
    weight: 5,
  },
  {
    key: 'typography_readability',
    title: 'Typography Readability & Scaling',
    description: 'Ensure line height is 140%-160% of font size. Use a clean, consistent typographic scaling rule.',
    category: 'UI_RULES',
    enabled: true,
    weight: 4,
  },
  {
    key: 'spacing_grid',
    title: '8-Pixel Grid Alignment',
    description: 'Margins, paddings, and alignment values must be whole multiples of 8 pixels.',
    category: 'UI_RULES',
    enabled: true,
    weight: 3,
  },
  {
    key: 'alignment_precision',
    title: 'Visual Grid Edge Alignment',
    description: 'Ensure elements align strictly along vertical grids. Align icons baseline to accompanying text.',
    category: 'UI_RULES',
    enabled: true,
    weight: 4,
  },
  {
    key: 'accessibility_contrast',
    title: 'WCAG 2.1 Color Contrast',
    description: 'Contrast ratios must exceed 4.5:1 for normal text and 3:1 for large display headers.',
    category: 'UI_RULES',
    enabled: true,
    weight: 5,
  }
];

export const prebakedReviews: AuditReport[] = [
  {
    id: 'rev_fintech_main',
    projectId: 'proj_fintech',
    name: 'Dashboard Overview Screen',
    imageUrl: 'mock_fintech',
    reviewType: ReviewType.FULL_AUDIT,
    score: 84,
    severity: Severity.MEDIUM,
    summary: 'The dashboard screen showcases an excellent dark aesthetic with beautiful modular cards. However, spacing around transaction rows deviates from the 8px grid system, and the primary action button touch target violates Fitts\'s Law on mobile breakpoints.',
    createdAt: '2026-06-29T21:00:00Z',
    issues: [
      {
        id: 'iss_ft_01',
        category: 'UX_RULES',
        ruleKey: 'fittss_law',
        title: "Primary Call-to-Action Touch Target",
        description: "The primary 'Transfer Funds' button has an active target height of only 32px. Users on mobile touch points will struggle with finger-press accuracy.",
        severity: 'high',
        boundingBox: { x: 30, y: 72, width: 40, height: 6 },
        recommendation: "Increase the padding-y to boost total target height to at least 44px, matching Apple HIG and Material guidelines.",
        confidence: 96
      },
      {
        id: 'iss_ft_02',
        category: 'UI_RULES',
        ruleKey: 'accessibility_contrast',
        title: "Micro-text Color Contrast Fails WCAG 2.1 AA",
        description: "The small transaction timestamp text is #52525b on #09090b, yielding a contrast ratio of only 2.3:1. Legibility is severely compromised.",
        severity: 'medium',
        boundingBox: { x: 15, y: 52, width: 25, height: 4 },
        recommendation: "Brighten the grey shade to #a1a1aa to raise the contrast above the AA threshold of 4.5:1 for small print.",
        confidence: 92
      },
      {
        id: 'iss_ft_03',
        category: 'UI_RULES',
        ruleKey: 'spacing_grid',
        title: "Transaction Card Offset Margin",
        description: "The spacing between the credit card card visual element and the transaction log list is 19px, which breaks the standard 8px grid system standard.",
        severity: 'low',
        boundingBox: { x: 5, y: 44, width: 90, height: 3 },
        recommendation: "Increase the spacing to 24px (3x 8px base grid) to maintain professional layout rhythm and token consistency.",
        confidence: 85
      }
    ],
    recommendations: [
      "Standardize button target paddings using the 8px token scale.",
      "Darken secondary container backgrounds to emphasize interactive elements better.",
      "Utilize Space Grotesk sparingly for display headers to keep visual weight balanced."
    ]
  },
  {
    id: 'rev_ecommerce_checkout',
    projectId: 'proj_ecommerce',
    name: 'Cart & Payment Form Redesign',
    imageUrl: 'mock_checkout',
    reviewType: ReviewType.UX_HEURISTICS,
    score: 68,
    severity: Severity.HIGH,
    summary: 'This checkout screen exhibits significant cognitive overload. Action triggers are grouped tightly, while forms lack clear visual boundaries, leading to poor error prevention.',
    createdAt: '2026-06-28T11:45:00Z',
    issues: [
      {
        id: 'iss_ec_01',
        category: 'UX_RULES',
        ruleKey: 'hicks_law',
        title: "Checkout Choice Paralysis",
        description: "The user is forced to choose between 4 parallel payment methods simultaneously alongside secondary discount code inputs and multiple newsletter subscriptions.",
        severity: 'high',
        boundingBox: { x: 10, y: 45, width: 80, height: 25 },
        recommendation: "Collapse secondary payments into an expandable section. Isolate the primary credit card payment flow first.",
        confidence: 94
      },
      {
        id: 'iss_ec_02',
        category: 'UX_RULES',
        ruleKey: 'nielsen_consistency',
        title: "Inconsistent Input Focus Outlines",
        description: "Standard text inputs use thin gray borders, but selection indicators shift abruptly to rounded outline pills, breaking spatial patterns.",
        severity: 'medium',
        boundingBox: { x: 20, y: 20, width: 60, height: 18 },
        recommendation: "Consolidate outline sizes and border radius tokens to a uniform 6px (rounded-md) standard.",
        confidence: 89
      }
    ],
    recommendations: [
      "Collapse credit card and shipping address forms into consecutive checkout step accordions.",
      "Highlight price sum totals at the top of the viewport on mobile views."
    ]
  }
];
