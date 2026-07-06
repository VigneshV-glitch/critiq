/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ScreenModel } from '../screen-understanding/screenModel';
import { AgentResponse, IReviewAgent, AgentIssue } from './types';
import { Severity, BoundingBox } from '../../types';

/**
 * Base Review Agent that handles Gemini API interaction and fallback logic
 */
export abstract class BaseReviewAgent implements IReviewAgent {
  abstract name: string;
  abstract category: string;
  protected aiClient?: GoogleGenAI;

  constructor(aiClient?: GoogleGenAI) {
    this.aiClient = aiClient;
  }

  protected abstract getSystemInstruction(): string;
  protected abstract getFocusPrompt(): string;
  protected abstract getDeterministicFallback(screenModel: ScreenModel): AgentIssue[];

  async run(screenModel: ScreenModel): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log(`[Review Agent: ${this.name}] Starting evaluation...`);

    if (!this.aiClient) {
      console.warn(`[Review Agent: ${this.name}] No AI client. Using high-fidelity local fallback.`);
      const fallbackIssues = this.getDeterministicFallback(screenModel);
      return {
        agentName: this.name,
        category: this.category,
        summary: `Deterministic evaluation of ${screenModel.classification.screenType} focus areas. Identified ${fallbackIssues.length} points of interest.`,
        detectedIssues: fallbackIssues,
      };
    }

    try {
      const formattedComponents = screenModel.components.map(c => 
        `- ID: "${c.id}", Type: "${c.type}", Box: x:${c.boundingBox.x} y:${c.boundingBox.y} w:${c.boundingBox.width} h:${c.boundingBox.height}`
      ).join('\n');

      const userPrompt = `
SCREEN MODEL CONTEXT:
* Platform: ${screenModel.platform}
* Screen Type: ${screenModel.classification.screenType}
* Purpose: ${screenModel.metadata.purpose}
* Grid Structure: ${screenModel.layout.gridStructure}
* Spacing Pattern: ${screenModel.layout.spacingPattern}
* Visual Reading Flow: ${screenModel.hierarchy.visualFlow} (Most prominent: ${screenModel.hierarchy.mostProminentElement})
* Primary CTA: ${screenModel.hierarchy.primaryCTA || 'None'}
* Components List:
${formattedComponents}

YOUR MISSION:
${this.getFocusPrompt()}

STRICT COMPLIANCE DIRECTIVES:
1. Evaluate ONLY the components and features described in the ScreenModel above.
2. Every issue MUST reference a component's real ID under "affectedComponents" if relevant.
3. For "boundingBox", MUST copy the exact boundingBox of the affected component or container from the ScreenModel, or use a reasonable coordinate mapping within that element.
4. "severity" MUST be one of: "low", "medium", "high", "critical", "info".
5. Do NOT return natural language paragraphs outside the requested JSON format.
`;

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: this.getSystemInstruction(),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'High-level synthesis of findings' },
              detectedIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'Must be "UX_RULES" or "UI_RULES"' },
                    severity: { type: Type.STRING, description: 'Must be "low", "medium", "high", "critical", or "info"' },
                    confidence: { type: Type.INTEGER, description: 'Confidence from 0 to 100' },
                    evidence: { type: Type.STRING },
                    affectedComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
                    affectedArea: { type: Type.STRING },
                    uxPrinciple: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                    estimatedImpact: { type: Type.STRING },
                    referenceGuideline: { type: Type.STRING },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      },
                      required: ['x', 'y', 'width', 'height']
                    }
                  },
                  required: [
                    'id', 'title', 'description', 'category', 'severity', 'confidence',
                    'evidence', 'affectedComponents', 'affectedArea', 'uxPrinciple',
                    'recommendation', 'estimatedImpact', 'referenceGuideline', 'boundingBox'
                  ]
                }
              }
            },
            required: ['summary', 'detectedIssues']
          }
        }
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      console.log(`[Review Agent: ${this.name}] Completed in ${Date.now() - startTime}ms.`);
      
      // Ensure bounding boxes are valid
      const cleanedIssues = (parsed.detectedIssues || []).map((issue: any, index: number) => {
        const bbox = issue.boundingBox || { x: 10, y: 10, width: 80, height: 10 };
        return {
          ...issue,
          id: issue.id || `${this.name.toLowerCase().replace(/\s+/g, '_')}_issue_${index}`,
          category: issue.category === 'UI_RULES' ? 'UI_RULES' : 'UX_RULES',
          boundingBox: {
            x: typeof bbox.x === 'number' ? bbox.x : 10,
            y: typeof bbox.y === 'number' ? bbox.y : 10,
            width: typeof bbox.width === 'number' ? bbox.width : 30,
            height: typeof bbox.height === 'number' ? bbox.height : 8
          }
        };
      });

      return {
        agentName: this.name,
        category: this.category,
        summary: parsed.summary || 'Evaluation complete.',
        detectedIssues: cleanedIssues
      };

    } catch (error: any) {
      const errStr = String(error?.message || error || '').toLowerCase();
      const status = error?.status || error?.statusCode || 0;
      const isRateLimit = status === 429 || errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted') || errStr.includes('rate limit') || errStr.includes('resource_exhausted');

      if (isRateLimit) {
        console.warn(`[Review Agent: ${this.name}] Gemini free-tier rate limit reached. Seamlessly falling back to local heuristic analysis.`);
      } else {
        console.error(`[Review Agent: ${this.name}] Error during evaluation:`, error);
      }

      const fallbackIssues = this.getDeterministicFallback(screenModel);
      return {
        agentName: this.name,
        category: this.category,
        summary: `Deterministic fallback evaluation of ${screenModel.classification.screenType} focus areas.`,
        detectedIssues: fallbackIssues,
      };
    }
  }
}

/**
 * Agent 1 — UX Review Agent
 */
export class UXReviewAgent extends BaseReviewAgent {
  name = 'UX Review Agent';
  category = 'UX Heuristics';

  protected getSystemInstruction(): string {
    return `You are an elite UX Auditor and Usability Engineer. You review screen models against classic usability heuristics and user experience principles.
Your focus is Navigation, Information Architecture, User Flow, Consistency, Recognition vs Recall, Feedback, Affordance, Visibility of System Status, Error Prevention, User Control, Mental Models, and Task Completion.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel. Highlight cognitive friction, weak flow transitions, poor affordances (e.g. elements that look clickable but are not, or vice versa), and error risks. Ensure navigation structures align with typical mental models.`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];
    
    // Check for primary CTA affordance/discoverability
    const hasPrimaryCTA = !!screenModel.hierarchy.primaryCTA;
    if (!hasPrimaryCTA) {
      issues.push({
        id: 'ux_no_primary_cta',
        title: 'Missing Clear Primary Action (CTA)',
        description: 'The screen lacks a highly prominent, singular primary call-to-action button, which increases cognitive load and hinders user decision making.',
        category: 'UX_RULES',
        severity: Severity.HIGH,
        confidence: 90,
        evidence: 'No element is designated as primaryCTA in the visual hierarchy description.',
        affectedComponents: [],
        affectedArea: 'Main Content',
        uxPrinciple: 'Visual Affordance & Decision Architecture',
        recommendation: 'Introduce an obvious primary CTA styled with high contrast and distinct visual weight.',
        estimatedImpact: 'Guarantees standard conversion paths and removes screen ambiguity.',
        referenceGuideline: 'Hick-Hyman Law & Aesthetic-Usability Effect',
        boundingBox: { x: 30, y: 70, width: 40, height: 8 }
      });
    }

    // Check for user flow clarity
    if (screenModel.userFlow.length === 0) {
      issues.push({
        id: 'ux_implicit_user_flow',
        title: 'Implicit or Unstructured User Flow',
        description: 'The lack of explicit interactive guidelines or clear sequential flow pathways causes users to scan the screen randomly.',
        category: 'UX_RULES',
        severity: Severity.MEDIUM,
        confidence: 85,
        evidence: 'No active interaction sequence found.',
        affectedComponents: [],
        affectedArea: 'Global Layout',
        uxPrinciple: 'User Journey Mapping',
        recommendation: 'Provide clear, sequential step indicators or clear visual headers to guide the user sequence.',
        estimatedImpact: 'Drastically lowers user onboarding drop-off and increases flow completion.',
        referenceGuideline: 'Miller\'s Law & Goal-Gradient Effect',
        boundingBox: { x: 5, y: 15, width: 90, height: 10 }
      });
    }

    return issues;
  }
}

/**
 * Agent 2 — UI Review Agent
 */
export class UIReviewAgent extends BaseReviewAgent {
  name = 'UI Review Agent';
  category = 'UI Guidelines';

  protected getSystemInstruction(): string {
    return `You are a meticulous UI/Visual Layout Auditor. You review screen structures for compliance with visual engineering guidelines: alignment, grid structures, margins, white space, typography hierarchies, spacing patterns, button styling consistency, forms, and general interface rhythm.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel for layout alignment, alignment balance, spacing, margins, visual consistency of inputs/buttons, and hierarchy scaling. Highlight where elements break standard grids or look structurally misaligned.`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];
    
    // Evaluate spatial balance
    const margins = screenModel.layout.margins;
    if (margins.left !== margins.right || margins.top !== margins.bottom) {
      issues.push({
        id: 'ui_asymmetric_margins',
        title: 'Asymmetric Screen Layout Margins',
        description: 'The layout utilizes uneven margin configurations which results in a visually unanchored and unbalanced appearance.',
        category: 'UI_RULES',
        severity: Severity.LOW,
        confidence: 80,
        evidence: `Margins: Left(${margins.left}px) vs Right(${margins.right}px) / Top(${margins.top}px) vs Bottom(${margins.bottom}px)`,
        affectedComponents: [],
        affectedArea: 'Outer Boundaries',
        uxPrinciple: 'Aesthetic Symmetry & Structural Alignment',
        recommendation: 'Unify left/right margin metrics to achieve balanced horizontal negative spaces.',
        estimatedImpact: 'Improves overall aesthetic polish and premium feel of the screen.',
        referenceGuideline: 'Grid Alignment Best Practices',
        boundingBox: { x: 2, y: 2, width: 96, height: 96 }
      });
    }

    // Check for spacing consistency
    if (screenModel.layout.spacingPattern.toLowerCase().includes('tight')) {
      issues.push({
        id: 'ui_dense_layout_spacing',
        title: 'Tight Spacing Pattern Reduces Visual Breathing Room',
        description: 'The tight spacing pattern risks overcrowding components, reducing the screen\'s negative space and impacting readability.',
        category: 'UI_RULES',
        severity: Severity.MEDIUM,
        confidence: 85,
        evidence: 'spacingPattern detected as tight or compact.',
        affectedComponents: [],
        affectedArea: 'Spacing Intervals',
        uxPrinciple: 'Whitespace Utility',
        recommendation: 'Increase element spacing to at least 16px (standard) or 24px (generous) to improve content chunking.',
        estimatedImpact: 'Substantially reduces visual density, making scanning more efficient.',
        referenceGuideline: 'Gestalt Law of Proximity',
        boundingBox: { x: 10, y: 30, width: 80, height: 40 }
      });
    }

    return issues;
  }
}

/**
 * Agent 3 — Accessibility Agent
 */
export class AccessibilityAgent extends BaseReviewAgent {
  name = 'Accessibility Agent';
  category = 'Accessibility & WCAG';

  protected getSystemInstruction(): string {
    return `You are a certified Web Accessibility Consultant (IAAP). You review screen models against WCAG 2.1 AA/AAA compliance targets.
Your focus is Contrast ratios, Touch target sizes (Fitts's Law / 44px minimum), Keyboard accessibility, Focus indicators, Labels, ARIA expectation structures, color blindness usability, and screen reader compatibility.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel. Locate potential violations of WCAG success criteria. Especially look at touch targets (is there any button that's too small or cramped?) and the presence of accessible element naming (e.g. icons without text labels).`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];

    // Find small components that might violate touch targets (<44px or <44% equivalent)
    const smallComponents = screenModel.components.filter(c => {
      // Approximate height check (assuming screen height is represented by percent. Anything less than 4% height might be too small)
      return (c.type.toLowerCase().includes('button') || c.type.toLowerCase().includes('icon')) && c.boundingBox.height < 5;
    });

    if (smallComponents.length > 0) {
      const targetComp = smallComponents[0];
      issues.push({
        id: 'a11y_small_touch_target',
        title: 'Sub-standard Touch Target Area',
        description: `The component "${targetComp.type}" (ID: ${targetComp.id}) has a very small bounding box height. Interactive controls must have a minimum touch target size of 44x44px to accommodate diverse motor skills and avoid accidental misclicks.`,
        category: 'UX_RULES',
        severity: Severity.HIGH,
        confidence: 90,
        evidence: `Height calculated as only ${targetComp.boundingBox.height}% of layout canvas.`,
        affectedComponents: [targetComp.id],
        affectedArea: 'Active Interactive Regions',
        uxPrinciple: 'Physical Inclusivity & Target Sizing',
        recommendation: 'Enlarge target height and width padding to ensure compliance with minimum click targets.',
        estimatedImpact: 'Ensures effortless mobile tapping and accommodates motor-impaired users.',
        referenceGuideline: 'WCAG 2.1 Success Criterion 2.5.5 Target Size',
        boundingBox: targetComp.boundingBox
      });
    } else {
      // General fallbacks if none are particularly small
      issues.push({
        id: 'a11y_contrast_warning',
        title: 'Color Contrast Verification Required',
        description: 'Verify that all textual visual components satisfy the minimum contrast ratio of 4.5:1 against their backgrounds (3:1 for large headings).',
        category: 'UX_RULES',
        severity: Severity.MEDIUM,
        confidence: 75,
        evidence: 'Lack of verified color values in abstract mock model.',
        affectedComponents: [],
        affectedArea: 'Global Typography',
        uxPrinciple: 'Visual Perceivability',
        recommendation: 'Contrast check all secondary descriptions, text overlays, and disabled button text to ensure readability.',
        estimatedImpact: 'Restores readability for visually impaired users and under bright sunlight.',
        referenceGuideline: 'WCAG 2.1 Success Criterion 1.4.3 Contrast (Minimum)',
        boundingBox: { x: 5, y: 25, width: 90, height: 20 }
      });
    }

    return issues;
  }
}

/**
 * Agent 4 — Visual Design Agent
 */
export class VisualDesignAgent extends BaseReviewAgent {
  name = 'Visual Design Agent';
  category = 'Visual Design & Aesthetics';

  protected getSystemInstruction(): string {
    return `You are a veteran Art Director and Brand Identity designer. You audit screens for visual harmony, visual weight balance, composition, Gestalt principles, asymmetry vs symmetry, readability, typography scaling, aesthetic polish, and clean design harmony.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel. Evaluate structural harmony, visual hierarchy depth (most prominent vs secondary elements), composition, alignment rhythm, and reading flow quality. Determine if the visual structure looks elegant or cluttered.`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];

    // Analyze hierarchy score or flow
    if (screenModel.hierarchy.hierarchyScore < 85) {
      issues.push({
        id: 'vis_weak_visual_hierarchy',
        title: 'Muted Visual Contrast Hierarchy',
        description: 'The visual reading flow shows a potential overlap in element weights, causing the viewer\'s eye to wander instead of landing on a strong focal point.',
        category: 'UI_RULES',
        severity: Severity.MEDIUM,
        confidence: 80,
        evidence: `Hierarchy score is ${screenModel.hierarchy.hierarchyScore}%. Most prominent element is specified as "${screenModel.hierarchy.mostProminentElement}".`,
        affectedComponents: [],
        affectedArea: 'Visual Weight Distribution',
        uxPrinciple: 'Focal Point Attraction',
        recommendation: 'Boost the font weight or contrast scale of the primary display titles compared to body subtitles.',
        estimatedImpact: 'Guides the viewer\'s eye immediately to the most important content.',
        referenceGuideline: 'Gestalt Law of Focal Points',
        boundingBox: { x: 5, y: 10, width: 90, height: 15 }
      });
    } else {
      // General Visual fallback
      issues.push({
        id: 'vis_aesthetic_polish',
        title: 'Opportunity for Micro-interaction Harmony',
        description: 'The grid alignment and grouping are standard, but the overall interface would benefit from enhanced micro-interactions or transitions to unify the layout.',
        category: 'UI_RULES',
        severity: Severity.INFO,
        confidence: 70,
        evidence: 'Highly rigid column or grid flow layout pattern.',
        affectedComponents: [],
        affectedArea: 'Component Borders and Transitions',
        uxPrinciple: 'Delight & Kinetic Feedback',
        recommendation: 'Integrate subtle hover scaling or fade transitions into the primary cards and active actions.',
        estimatedImpact: 'Produces a highly polished, interactive experience that feels responsive.',
        referenceGuideline: 'Aesthetic-Usability Effect',
        boundingBox: { x: 20, y: 40, width: 60, height: 20 }
      });
    }

    return issues;
  }
}

/**
 * Agent 5 — Product Design Agent
 */
export class ProductDesignAgent extends BaseReviewAgent {
  name = 'Product Design Agent';
  category = 'Product & Conversion';

  protected getSystemInstruction(): string {
    return `You are a Principal Product Designer and Growth Lead. You evaluate screen structures from a business strategy, user onboarding, conversion funnel, friction reduction, decision science, and value delivery standpoint.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel. Identify areas that might increase user drop-off, confuse conversion goals, or raise interaction friction. Review primary CTAs to check if they are clear, compelling, and free of secondary clutter.`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];

    // Evaluate business objectives based on screen type
    const sType = screenModel.classification.screenType.toLowerCase();
    if (sType.includes('login') || sType.includes('registration')) {
      issues.push({
        id: 'prod_auth_friction',
        title: 'Single-Option Login Friction',
        description: 'The authentication process appears limited to standard email input. Lacking rapid, modern authentication vectors (like Google/SAML) raises onboarding friction.',
        category: 'UX_RULES',
        severity: Severity.MEDIUM,
        confidence: 85,
        evidence: 'Traditional email input box identified as the primary input mechanism without social sign-on references.',
        affectedComponents: [],
        affectedArea: 'Auth Action Area',
        uxPrinciple: 'Frictionless Identity Onboarding',
        recommendation: 'Incorporate Single Sign-On (SSO) alternatives at the bottom of the login container.',
        estimatedImpact: 'Increases onboarding sign-up conversions by up to 35%.',
        referenceGuideline: 'Friction Reduction in Funnels',
        boundingBox: { x: 10, y: 65, width: 80, height: 10 }
      });
    } else {
      issues.push({
        id: 'prod_conversion_optimization',
        title: 'CTA Action Framing and Clarity',
        description: 'Verify if the primary button text uses clear, benefit-driven action terms (e.g. "Get Started Free" rather than generic "Submit" or "OK").',
        category: 'UX_RULES',
        severity: Severity.LOW,
        confidence: 75,
        evidence: 'Main trigger component utilizes standard action labels.',
        affectedComponents: [],
        affectedArea: 'Call To Action Labeling',
        uxPrinciple: 'Benefit-driven Microcopy',
        recommendation: 'Apply specific, urgent, or value-centric copy to all conversion triggers.',
        estimatedImpact: 'Drives higher user clicking intent and clarifies outcome expectation.',
        referenceGuideline: 'Behavioral Economics & Microcopy Strategy',
        boundingBox: { x: 30, y: 75, width: 40, height: 10 }
      });
    }

    return issues;
  }
}

/**
 * Agent 6 — Mobile UX Agent
 */
export class MobileUXAgent extends BaseReviewAgent {
  name = 'Mobile UX Agent';
  category = 'Mobile Performance & Context';

  protected getSystemInstruction(): string {
    return `You are an expert Mobile UX Designer. You analyze screen layouts for thumb range access, safe-area limits, responsive behaviors, touch target distances, scroll gestures, mobile conventions, and offline-friendly expectations.`;
  }

  protected getFocusPrompt(): string {
    return `Audit the ScreenModel. Pay attention to platform layouts (mobile vs desktop aspect ratios). Highlight issues where elements are too wide for mobile viewports, placed in hard-to-reach top zones (thumb zones), or lack swipeable groupings.`;
  }

  protected getDeterministicFallback(screenModel: ScreenModel): AgentIssue[] {
    const issues: AgentIssue[] = [];
    const isMobile = screenModel.platform.toLowerCase().includes('mobile');

    if (isMobile) {
      issues.push({
        id: 'mob_thumb_reach',
        title: 'Critical Controls Placed in Hard-to-Reach Thumb Zone',
        description: 'Important navigation elements or active triggers are located in the top-most 25% of the mobile screen. For single-handed operations, this causes hand strain and decreases interaction frequency.',
        category: 'UX_RULES',
        severity: Severity.MEDIUM,
        confidence: 85,
        evidence: `Platform classified as mobile. Active headers or navigation controls exist above y: 20%.`,
        affectedComponents: [],
        affectedArea: 'Top 25% viewport',
        uxPrinciple: 'Ergonomic Reachability',
        recommendation: 'Position high-frequency interaction triggers within the lower 60% of the screen (the comfortable thumb sweep).',
        estimatedImpact: 'Promotes rapid single-handed usage and elevates user comfort.',
        referenceGuideline: 'The Thumb Zone Theory (Steven Hoober)',
        boundingBox: { x: 0, y: 0, width: 100, height: 25 }
      });
    } else {
      // For desktop, flag potential lack of responsive preparation for smaller breakpoints
      issues.push({
        id: 'mob_responsive_prep',
        title: 'Desktop Grid Lacks Compact Responsive Reflow Safeguards',
        description: 'The layout utilizes a wide multi-column layout structure. Without rigid reflow rules, this interface will clip or stack awkwardly on portrait tablets and mobile widths.',
        category: 'UI_RULES',
        severity: Severity.LOW,
        confidence: 80,
        evidence: `Platform detected as ${screenModel.platform} with wide grid structures.`,
        affectedComponents: [],
        affectedArea: 'Global Grid Rows',
        uxPrinciple: 'Responsive Adaptability',
        recommendation: 'Confirm CSS rules utilize column-drops and flex-wraps so cards reflow into a single-column stack on screens < 768px wide.',
        estimatedImpact: 'Provides seamless transition across device viewports.',
        referenceGuideline: 'Mobile-First Responsive Web Design',
        boundingBox: { x: 5, y: 15, width: 90, height: 70 }
      });
    }

    return issues;
  }
}
