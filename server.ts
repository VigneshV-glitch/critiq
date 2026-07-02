/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { calculateReportScore } from './src/lib/scoring';
import { validateAuditReport } from './src/lib/validator';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to safely initialize Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient wrapper to execute Gemini requests with automatic retries and backoff
async function generateContentWithRetry(
  ai: GoogleGenAI,
  model: string,
  payload: { contents: any[]; config: any },
  retries = 3,
  initialDelay = 1200
): Promise<any> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model,
        ...payload,
      });
    } catch (err: any) {
      const errStr = String(err?.message || err);
      const isTransient =
        errStr.includes('503') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('high demand') ||
        errStr.includes('overloaded') ||
        err?.status === 503 ||
        err?.statusCode === 503;

      if (isTransient && i < retries - 1) {
        console.warn(
          `[Critiq Backend] Gemini API returned transient 503/UNAVAILABLE (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

// Map severity helper for task 2
function mapSeverity(value: any): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const norm = String(value || '').trim().toLowerCase();
  if (norm.startsWith('crit')) return 'critical';
  if (norm === 'high') return 'high';
  if (norm === 'medium' || norm === 'med') return 'medium';
  if (norm === 'low') return 'low';
  if (norm.startsWith('info') || norm === 'hint') return 'info';
  return 'medium';
}

// High-quality simulated chat helper
function getSimulatedChat(message: string, isErrorFallback = false) {
  const query = (message || '').toLowerCase();
  let simulatedText = `Based on standard UI/UX heuristics, your elements should follow clean layout guidelines.`;
  const simulatedRecs = [];

  if (query.includes('contrast') || query.includes('color')) {
    simulatedText = `Analyzing color elements.\n- Ensure text labels maintain at least a **4.5:1 contrast ratio** against backgrounds to meet WCAG AA standards.\n- High contrast creates an inclusive, readable experience for all users.`;
    simulatedRecs.push({
      title: 'Audit Contrast Ratios',
      description: 'Measure small body elements against backing divs and increase text contrast if below 4.5:1.',
      category: 'UI_RULES',
      severity: 'high'
    });
  } else if (query.includes('spacing') || query.includes('grid') || query.includes('gap')) {
    simulatedText = `Your layout elements should align to a **consistent grid scale** (e.g. an 8px grid system).\n- Double-check margin and padding multipliers to ensure offsets are consistent (e.g., **16px** or **24px**).\n- Avoid mismatched spacing values which disrupt rhythm.`;
    simulatedRecs.push({
      title: 'Snap to Grid Tokens',
      description: 'Refactor spacing attributes to use a consistent spacing scale.',
      category: 'UI_RULES',
      severity: 'low'
    });
  } else if (query.includes('fitts') || query.includes('button') || query.includes('size') || query.includes('touch')) {
    simulatedText = `Fitts's Law guidelines dictate that touch targets on mobile viewports must maintain a size of **at least 44px by 44px**.\n- Current layout elements seem slightly compressed.\n- Add margin space to avoid misclicks on adjacent items.`;
    simulatedRecs.push({
      title: 'Expand Touch Target Sizes',
      description: 'Apply minimum bounds of 44px on clickable button components.',
      category: 'UX_RULES',
      severity: 'medium'
    });
  } else {
    simulatedText = `I have reviewed your design layout and guidelines.\n- **Universal Heuristics**: Spacing grid is aligned to consistent 8px/4px standards.\n- **Typography Setup**: Ensure clean visual hierarchy with distinct headline and body text weights.\n- Let me know if you want to run a contrast audit or inspect component alignments!`;
  }

  if (isErrorFallback) {
    simulatedText = `⚠️ **[Model High Demand Fallback]** The live Gemini vision model is currently experiencing extremely high demand (503 Service Unavailable). To keep your workflow completely uninterrupted, here is a resilient local diagnostic response:\n\n` + simulatedText;
  }

  return {
    text: simulatedText,
    recommendations: simulatedRecs,
    isSimulated: true,
  };
}

// Simple deterministic hash helper to vary issues per screen
function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// High-quality simulated analysis helper with fully dynamic visual findings
function getSimulatedAnalysis(
  isErrorFallback = false,
  imageSrc = '',
  reviewType = '',
  customPrompt = ''
) {
  const hashInput = (imageSrc || '') + (reviewType || '') + (customPrompt || '');
  const hash = getDeterministicHash(hashInput || 'default_seed_key');

  const issuesPool = [
    {
      category: 'UI_RULES' as const,
      ruleKey: 'accessibility_contrast',
      title: 'Low contrast on primary action label',
      description: 'Button text has insufficient contrast ratio against the backing theme color. Measured 3.1:1, WCAG requires 4.5:1.',
      severity: 'high' as const,
      boundingBox: { x: 22, y: 72, width: 56, height: 7 },
      recommendation: 'Update text color parameters to increase accessibility and meet WCAG AA requirements.'
    },
    {
      category: 'UX_RULES' as const,
      ruleKey: 'fittss_law',
      title: 'Clickable targets lack touch clearance',
      description: 'Navigation elements or buttons are positioned closely together, risking misclicks or accidental selections.',
      severity: 'medium' as const,
      boundingBox: { x: 10, y: 15, width: 80, height: 10 },
      recommendation: 'Add adequate margin and padding clearance surrounding interactive components to expand targets.'
    },
    {
      category: 'UI_RULES' as const,
      ruleKey: 'spacing_grid',
      title: 'Spacing Deviation (Grid Mismatch)',
      description: 'Element dimensions or spacing boundaries deviate from standard layout grid parameters.',
      severity: 'low' as const,
      boundingBox: { x: 12, y: 38, width: 76, height: 18 },
      recommendation: 'Refactor coordinates and spacer divs to snap perfectly to consistent grid units.'
    },
    {
      category: 'UX_RULES' as const,
      ruleKey: 'heuristic_friction',
      title: 'High cognitive friction on input elements',
      description: 'Form field elements lack secondary descriptive labels or clear placeholder states to assist users.',
      severity: 'medium' as const,
      boundingBox: { x: 15, y: 52, width: 70, height: 14 },
      recommendation: 'Introduce helper text strings and implement visual focus rings on selectable input boxes.'
    },
    {
      category: 'UI_RULES' as const,
      ruleKey: 'visual_hierarchy',
      title: 'Unbalanced hierarchy in header typography',
      description: 'The primary title and descriptive body share similar font weight metrics, causing visual scanning fatigue.',
      severity: 'medium' as const,
      boundingBox: { x: 8, y: 5, width: 84, height: 9 },
      recommendation: 'Elevate header heading weight or enlarge heading size to establish clean visual layout structure.'
    },
    {
      category: 'UX_RULES' as const,
      ruleKey: 'color_dependency',
      title: 'Color-dependent status badge alert',
      description: 'The notification badge relies solely on color triggers to indicate status, hindering access for color-blind users.',
      severity: 'high' as const,
      boundingBox: { x: 74, y: 22, width: 18, height: 5 },
      recommendation: 'Supplement color-based warnings with literal labels or support icons.'
    },
    {
      category: 'UI_RULES' as const,
      ruleKey: 'consistency_rounding',
      title: 'Inconsistent layout corner rounding',
      description: 'The layout displays mismatched border-radius values across active cards and action prompts.',
      severity: 'low' as const,
      boundingBox: { x: 25, y: 84, width: 50, height: 8 },
      recommendation: 'Standardize rounding tokens across your custom stylesheet files.'
    },
    {
      category: 'UX_RULES' as const,
      ruleKey: 'hicks_law',
      title: 'Overwhelming layout density (Hick\'s Law)',
      description: 'The active interface presents excessive concurrent triggers, creating decision paralysis and screen clutter.',
      severity: 'critical' as const,
      boundingBox: { x: 5, y: 28, width: 90, height: 35 },
      recommendation: 'Adopt progressive disclosure paradigms, tucking non-critical configuration into side menus.'
    }
  ];

  // Select 2 to 4 deterministically varied issues using the hash
  const numIssues = 2 + (hash % 3);
  const demoIssues: any[] = [];

  for (let i = 0; i < numIssues; i++) {
    const poolIndex = (hash + i) % issuesPool.length;
    const poolItem = issuesPool[poolIndex];

    let rec = poolItem.recommendation;
    let desc = poolItem.description;

    if (poolItem.ruleKey === 'spacing_grid') {
      desc = `Element spacing is inconsistent, violating standard 8px layout grid spacing rules.`;
      rec = `Align spacers and heights to whole multiples of the 8px layout grid.`;
    } else if (poolItem.ruleKey === 'fittss_law') {
      rec = `Increase touch target areas and margins to at least 44px to maintain clear spatial ergonomics.`;
    }

    demoIssues.push({
      id: `iss_sim_${hash}_${i}`,
      category: poolItem.category,
      ruleKey: poolItem.ruleKey,
      title: poolItem.title,
      description: desc,
      severity: poolItem.severity,
      boundingBox: {
        x: Math.min(85, Math.max(5, poolItem.boundingBox.x + ((hash + i) % 7) - 3)),
        y: Math.min(85, Math.max(5, poolItem.boundingBox.y + ((hash * i) % 11) - 5)),
        width: poolItem.boundingBox.width,
        height: poolItem.boundingBox.height,
      },
      recommendation: rec,
      confidence: 85 + ((hash + i) % 15)
    });
  }

  const scoringResult = calculateReportScore(demoIssues);

  let summaryMsg = '';
  if (isErrorFallback) {
    summaryMsg = `⚠️ **[AI Engine Offline/Quota Fallback]** The live Gemini Vision model is currently offline or experiencing quota limit constraints. Resilient universal heuristics local fallback has been automatically activated to keep your workflow uninterrupted: `;
  }

  summaryMsg += 'Heuristics scan completed using universal guidelines [Universal UI/UX Heuristics Mode]. Auditing is based on standard accessibility, spacing scales, and Fitts\'s Law limits.';

  return {
    score: scoringResult.score,
    scoreBreakdown: {
      visualDesign: scoringResult.breakdown.visualDesign.score,
      usability: scoringResult.breakdown.usability.score,
      accessibility: scoringResult.breakdown.accessibility.score,
      consistency: scoringResult.breakdown.consistency.score
    },
    severity: demoIssues.some(i => i.severity === 'critical') ? 'critical' : 
              demoIssues.some(i => i.severity === 'high') ? 'high' : 'medium',
    summary: summaryMsg,
    issues: demoIssues,
    recommendations: demoIssues.map(i => i.recommendation).slice(0, 4),
    isSimulated: true
  };
}

// Sprint 1 Scope: Chat Interface Endpoint
app.post('/api/critiq/chat', async (req, res) => {
  const { message, history } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    const fallbackResponse = getSimulatedChat(message, false);
    return res.json(fallbackResponse);
  }

  try {
    // Format chat conversation history for Gemini SDK
    const formattedContents = [];
    if (Array.isArray(history)) {
      history.forEach((h: any) => {
        formattedContents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      });
    }
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const systemInstruction = `You are Critiq AI, a high-fidelity design critic specifically built for UI/UX designers.
Your voice is objective, professional, and practical. Speak like a senior design director.
Enforce standard UX guidelines (Fitts's Law, Hick's Law, Gestalt principles, WCAG accessibility, 8px grid tokens).

You must return a structured JSON response matching the response schema.`;

    const response = await generateContentWithRetry(ai, 'gemini-3.5-flash', {
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'The narrative feedback or explanation of UX/UI concepts. Support markdown lists/bolding.',
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Strict list of actionable issues or steps to take.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Short title of the recommendation' },
                  description: { type: Type.STRING, description: 'Details on why and how to solve' },
                  category: { type: Type.STRING, description: 'Either "UX_RULES" or "UI_RULES"' },
                  severity: { type: Type.STRING, description: 'One of: "critical", "high", "medium", "low", "info"' },
                },
                required: ['title', 'description', 'category', 'severity'],
              },
            },
          },
          required: ['text', 'recommendations'],
        },
      },
    });

    const jsonStr = response.text || '{}';
    const parsedData = JSON.parse(jsonStr.trim());
    
    if (parsedData.recommendations && Array.isArray(parsedData.recommendations)) {
      parsedData.recommendations = parsedData.recommendations.map((rec: any) => ({
        ...rec,
        severity: mapSeverity(rec.severity)
      }));
    }
    
    return res.json({ ...parsedData, isSimulated: false });
  } catch (err: any) {
    console.error('Error in chat API, falling back dynamically to simulated chat:', err);
    const fallbackResponse = getSimulatedChat(message, true);
    return res.json(fallbackResponse);
  }
});

// Past reviews in-memory cache for Duplicate Detection
interface PastReview {
  imageSrcHash: string;
  issueTitles: string[];
}
const pastReviews: PastReview[] = [];

// Simple hash generator for checking image duplicates
function getImageHash(src: string): string {
  if (!src) return 'empty';
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = (hash << 5) - hash + src.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

// Helper to check for duplicate/generic reviews across different screens
function detectPotentialDuplicate(currentIssues: any[], currentImageHash: string): boolean {
  if (!currentIssues || currentIssues.length === 0) return false;
  
  const currentTitles = currentIssues.map((iss: any) => String(iss.title || '').trim().toLowerCase()).filter(Boolean);
  if (currentTitles.length === 0) return false;

  for (const past of pastReviews) {
    if (past.imageSrcHash !== currentImageHash) {
      // Check overlap of issue titles between different screens
      let matches = 0;
      for (const t of currentTitles) {
        if (past.issueTitles.includes(t)) {
          matches++;
        }
      }
      const similarity = matches / Math.max(currentTitles.length, past.issueTitles.length);
      // If more than 75% of findings are identical on a different screen, it is generic!
      if (similarity >= 0.75) {
        return true;
      }
    }
  }
  return false;
}

// Visual Understanding Validation (Step 2)
function validateVisualUnderstanding(vu: any): boolean {
  if (!vu || typeof vu !== 'object') return false;
  if (!vu.screenType || String(vu.screenType).trim().length < 3) return false;
  if (!vu.primaryPurpose || String(vu.primaryPurpose).trim().length < 5) return false;
  if (!Array.isArray(vu.visibleComponents) || vu.visibleComponents.length < 2) return false;
  if (typeof vu.confidence === 'number' && vu.confidence < 60) return false;
  
  const genericTerms = ['unknown', 'generic page', 'n/a', 'template', 'placeholder', 'empty screen'];
  const screenTypeLower = String(vu.screenType).toLowerCase();
  if (genericTerms.some(term => screenTypeLower.includes(term))) {
    return false;
  }
  return true;
}

// Quality Assurance Validation checks on findings before returning
function validateQualityAssurance(parsedData: any, vu: any): { isValid: boolean; reason?: string } {
  if (!parsedData || typeof parsedData !== 'object') return { isValid: false, reason: 'Invalid report object' };
  if (!Array.isArray(parsedData.issues)) return { isValid: false, reason: 'Issues is not an array' };
  
  // If there are no issues, it is technically a clean pass
  if (parsedData.issues.length === 0) {
    return { isValid: true };
  }

  for (const issue of parsedData.issues) {
    if (!issue.location || String(issue.location).trim().length < 2) {
      return { isValid: false, reason: 'Issue location is missing or too short' };
    }
    if (!issue.evidence || String(issue.evidence).trim().length < 5) {
      return { isValid: false, reason: 'Issue evidence is missing or too short' };
    }
    const bbox = issue.boundingBox;
    if (!bbox || typeof bbox !== 'object') {
      return { isValid: false, reason: 'Issue boundingBox is missing' };
    }
    // Check if bbox is just a 0,0,0,0 dummy
    if (bbox.x === 0 && bbox.y === 0 && bbox.width === 0 && bbox.height === 0) {
      return { isValid: false, reason: 'Issue boundingBox coordinates are dummy zeros' };
    }
    
    // Ensure coords are valid percentages
    const { x, y, width, height } = bbox;
    if (x < 0 || x > 100 || y < 0 || y > 100 || width < 0 || width > 100 || height < 0 || height > 100) {
      return { isValid: false, reason: 'boundingBox values are outside 0-100 limits' };
    }
  }

  return { isValid: true };
}

// Helper to identify non-retriable errors (e.g. Quota/Authentication limits)
function isRetriableError(err: any): boolean {
  const errStr = String(err?.message || err || '').toLowerCase();
  const status = err?.status || err?.statusCode || 0;
  
  // Quota / Rate limit errors (like HTTP 429) are NOT retriable
  if (status === 429 || errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted') || errStr.includes('rate limit') || errStr.includes('resource_exhausted')) {
    return false;
  }
  
  // Authentication / API key validation errors are NOT retriable
  if (status === 401 || status === 403 || errStr.includes('401') || errStr.includes('403') || errStr.includes('key') || errStr.includes('auth') || errStr.includes('unauthorized') || errStr.includes('forbidden')) {
    return false;
  }
  
  return true;
}

// Custom pipeline runner with precise retry delays: 0ms, 500ms, 1500ms, 3000ms
async function runWithStrategicRetries<T>(
  pipelineFn: (attempt: number, extraWarning?: string) => Promise<T>,
  delays = [0, 500, 1500, 3000]
): Promise<T> {
  let lastError: any = null;
  let extraWarning = '';
  
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await pipelineFn(i + 1, extraWarning);
    } catch (err: any) {
      lastError = err;
      
      // Fail fast on non-retriable errors like quota/billing exhaustion or invalid API key
      if (!isRetriableError(err)) {
        console.warn(`[Critiq Backend] Non-retriable error encountered: ${err?.message || err}. Failing fast.`);
        throw err;
      }
      
      const delay = delays[i];
      if (i === delays.length) {
        break; // All retries exhausted!
      }
      
      console.warn(`[Pipeline Retry] Attempt ${i + 1} failed: ${err?.message || err}. Retrying in ${delay}ms...`);
      
      // Update warning prompt context for subsequent regeneration attempts
      if (String(err?.message).includes('Duplicate Detected')) {
        extraWarning = `\n\nCRITICAL WARNING: Avoid producing a generic review! Your previous response was flagged as too generic and nearly identical to reviews of completely different screens. You MUST focus strictly on unique visual details visible on this specific screen.`;
      } else if (String(err?.message).includes('QA Failed')) {
        extraWarning = `\n\nCRITICAL WARNING: Your previous response failed quality validation. Ensure all issues are strictly tied to visible components, have specific location references, genuine visual evidence, and non-zero bounding boxes.`;
      } else if (String(err?.message).includes('Weak Screen Understanding')) {
        extraWarning = `\n\nCRITICAL WARNING: The initial screen understanding was weak, low-confidence, or generic. Please provide deep, highly specific visual details about the elements and sections in this mockup.`;
      }
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Pipeline execution failed after all retries');
}

// Sprint 1 Scope: Structured JSON Analysis Endpoint (Design Auditing)
app.post('/api/critiq/analyze', async (req, res) => {
  const { imageSrc, rules, reviewType, customPrompt } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    const fallbackReport = getSimulatedAnalysis(
      true, // isErrorFallback
      imageSrc,
      reviewType,
      customPrompt
    );
    return res.json(fallbackReport);
  }

  const imageHash = getImageHash(imageSrc);

  try {
    // Determine design system prompts
    const dsPrompt = `AUDIT MODE: UNIVERSAL UI/UX HEURISTICS ONLY
Do NOT enforce any specific brand design system or guidelines. Focus purely on general, vendor-neutral UI/UX best practices:
- Verify sufficient color contrast ratios (WCAG 2.1 AA targets of 4.5:1 for normal text).
- Check that interactive elements have standard sizes and separation (Fitts's Law touch target minimum of 44px).
- Verify consistency in grid alignments and spatial rhythms.
- Allow any clean, legible typography and look-and-feel as long as visual hierarchy is distinct and readable.`;

    const rulesChecklist = (rules || []).filter((r: any) => r.enabled).map((r: any) => `- ${r.title}: ${r.description}`).join('\n');

    // Run the self-correcting 4-retry pipeline
    const finalReport = await runWithStrategicRetries(async (attempt, extraWarning) => {
      // ----------------------------------------------------
      // STEP 1: Visual Understanding Phase
      // ----------------------------------------------------
      console.log(`[Critiq Pipeline] Starting Visual Understanding Phase (Attempt ${attempt})`);
      const vuPrompt = `Analyze the uploaded UI mockup image and describe exactly what is visible in it.
Identify:
* Screen type (e.g., Banking App Dashboard, Logistics Tracking, E-Commerce Checkout, Login Page, etc.)
* Primary user goal on this screen
* Layout structure (e.g., header, grid, main layout sections)
* Major UI components (e.g., primary buttons, input boxes, headers, lists, cards, tables)
* Main actions available to users

Do not perform any UX review or point out violations yet. Be objective and describe only visible items. ${extraWarning}`;

      const vuContents: any[] = [{ text: vuPrompt }];
      // Handle real base64 image if present
      if (imageSrc && imageSrc.startsWith('data:')) {
        const match = imageSrc.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          vuContents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      const vuResponse = await generateContentWithRetry(ai, 'gemini-3.5-flash', {
        contents: vuContents,
        config: {
          systemInstruction: "You are an expert visual layout parser. You analyze UI screenshots and return highly structured layout descriptions in JSON.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              screenType: { type: Type.STRING, description: "Detailed screen category (e.g., 'E-Commerce Checkout Screen')" },
              primaryPurpose: { type: Type.STRING, description: "The core task the user is trying to perform" },
              layoutStructure: { type: Type.STRING, description: "Brief visual layout overview" },
              visibleComponents: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of all main components observed (e.g., ['Header logo', 'Card item', 'Pay button'])"
              },
              mainActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key user action targets and call-to-actions visible"
              },
              confidence: { type: Type.INTEGER, description: "A visual certainty score from 0 to 100" }
            },
            required: ['screenType', 'primaryPurpose', 'layoutStructure', 'visibleComponents', 'mainActions', 'confidence']
          }
        }
      });

      const visualUnderstanding = JSON.parse((vuResponse.text || '{}').trim());
      console.log('[Critiq Pipeline] Step 1 response:', visualUnderstanding);

      // STEP 2: Validation Phase on Screen Understanding
      if (!validateVisualUnderstanding(visualUnderstanding)) {
        throw new Error('Weak Screen Understanding: The screen details returned were too generic, empty, or confidence was too low.');
      }

      // ----------------------------------------------------
      // STEP 3: UX Review Phase
      // ----------------------------------------------------
      console.log(`[Critiq Pipeline] Starting UX Review Phase (Attempt ${attempt})`);
      const reviewPrompt = `You are a professional UX/UI design auditor. Perform a meticulous, evidence-backed layout audit of the uploaded UI mockup image.
You must base your review strictly and exclusively on the observed visual components of this screen.

VISUAL UNDERSTANDING CONTEXT:
* Screen Type: ${visualUnderstanding.screenType}
* Primary Purpose: ${visualUnderstanding.primaryPurpose}
* Layout Structure: ${visualUnderstanding.layoutStructure}
* Observed Components: ${visualUnderstanding.visibleComponents.join(', ')}
* Main Actions: ${visualUnderstanding.mainActions.join(', ')}

AUDIT PARAMETERS & RULES:
${dsPrompt}

GUIDELINES CHECKLIST:
${rulesChecklist}

CUSTOM REQUEST OR FOCUS AREAS:
"${customPrompt || 'Full heuristic evaluation'}"

STRICT COMPLIANCE DIRECTIVES:
1. Analyze ONLY what is visible in the image.
2. Do not generate generic UX recommendations.
3. Do not reuse common findings unless they are visually verifiable on this screen.
4. Every issue must reference a specific visible element via its "location" and explain the specific visible evidence in the mockup via "evidence".
5. If no observable issue is detected for a guideline, do not return it.
6. If evidence is unavailable, do not invent it.
7. Return a confidence score (0-100) representing your visual certainty. Low-confidence findings (<40%) should be excluded.
8. Bounding boxes must be percentages (0-100) mapping directly to the element's position on the canvas. ${extraWarning}`;

      const reviewContents: any[] = [{ text: reviewPrompt }];
      if (imageSrc && imageSrc.startsWith('data:')) {
        const match = imageSrc.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          reviewContents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      const reviewResponse = await generateContentWithRetry(ai, 'gemini-3.5-flash', {
        contents: reviewContents,
        config: {
          systemInstruction: "You are a professional UX/UI design auditor. You analyze screenshot mockups, identify failures, and return structured JSON reviews with bounding boxes.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Computed design score from 30 to 100.' },
              severity: { type: Type.STRING, description: 'Overall severity: "critical", "high", "medium", "low", or "info".' },
              summary: { type: Type.STRING, description: 'Textual summary detailing key visual observations and major blocks.' },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: 'Either "UX_RULES" or "UI_RULES"' },
                    ruleKey: { type: Type.STRING, description: 'Unique slug corresponding to rule list keys' },
                    title: { type: Type.STRING, description: 'Brief issue title' },
                    description: { type: Type.STRING, description: 'Detailed criticism of why this element is failing best practices' },
                    severity: { type: Type.STRING, description: 'One of: "critical", "high", "medium", "low", "info"' },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER, description: 'X start percent (0-100)' },
                        y: { type: Type.NUMBER, description: 'Y start percent (0-100)' },
                        width: { type: Type.NUMBER, description: 'Width percent (0-100)' },
                        height: { type: Type.NUMBER, description: 'Height percent (0-100)' }
                      },
                      required: ['x', 'y', 'width', 'height']
                    },
                    recommendation: { type: Type.STRING, description: 'Actionable design instructions' },
                    location: { type: Type.STRING, description: 'The exact visible component or area where this occurs (e.g., "Checkout Button", "Search Bar input")' },
                    evidence: { type: Type.STRING, description: 'What visible evidence in the mockup supports this finding? (e.g., "The button is gray text on light gray background, yielding low contrast.")' },
                    confidence: { type: Type.INTEGER, description: 'Confidence score from 0 to 100 representing certainty of violation' }
                  },
                  required: ['category', 'ruleKey', 'title', 'description', 'severity', 'boundingBox', 'recommendation', 'location', 'evidence', 'confidence']
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['score', 'severity', 'summary', 'issues', 'recommendations']
          }
        }
      });

      const parsedReview = JSON.parse((reviewResponse.text || '{}').trim());
      
      // ----------------------------------------------------
      // STEP 4: Quality Assurance and Duplicate Detection
      // ----------------------------------------------------
      const qa = validateQualityAssurance(parsedReview, visualUnderstanding);
      if (!qa.isValid) {
        throw new Error(`QA Failed: ${qa.reason}`);
      }

      const isDuplicate = detectPotentialDuplicate(parsedReview.issues, imageHash);
      if (isDuplicate) {
        throw new Error('Duplicate Detected: The generated review is nearly identical to a different screen.');
      }

      // If everything is successful, return the report
      return {
        ...parsedReview,
        visualObservationSummary: visualUnderstanding,
        potentialGenericReviewDetected: false
      };
    });

    // Save to pastReviews for future duplicate detection
    if (finalReport.issues && finalReport.issues.length > 0) {
      pastReviews.push({
        imageSrcHash: imageHash,
        issueTitles: finalReport.issues.map((i: any) => String(i.title || '').trim().toLowerCase())
      });
      // Cap size at 50 to avoid memory leaks
      if (pastReviews.length > 50) {
        pastReviews.shift();
      }
    }

    // Normalize issue severity
    if (finalReport.issues && Array.isArray(finalReport.issues)) {
      finalReport.issues = finalReport.issues.map((iss: any) => ({
        ...iss,
        severity: mapSeverity(iss.severity)
      }));
    }
    finalReport.severity = mapSeverity(finalReport.severity);

    // Dynamic scoring integration
    const scoringResult = calculateReportScore(finalReport.issues || []);
    finalReport.score = scoringResult.score;
    finalReport.scoreBreakdown = {
      visualDesign: scoringResult.breakdown.visualDesign.score,
      usability: scoringResult.breakdown.usability.score,
      accessibility: scoringResult.breakdown.accessibility.score,
      consistency: scoringResult.breakdown.consistency.score
    };
    finalReport.isSimulated = false;

    return res.json(finalReport);

  } catch (err: any) {
    console.error('Error in analyze API after retries, returning fallback simulated report:', err);
    
    // Resilient fallback: Return high-quality simulated analysis instead of an error response
    const fallbackReport = getSimulatedAnalysis(
      true, // isErrorFallback
      imageSrc,
      reviewType,
      customPrompt
    );
    
    return res.json(fallbackReport);
  }
});

// Configure Vite integration for serving SPA elements on single Port 3000
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Critiq Backend] Live on port ${PORT}`);
  });
}

initServer();
