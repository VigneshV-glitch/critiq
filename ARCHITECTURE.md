# Critiq: Technical Architecture & Product Specification
**AI-Powered UI/UX Audit & Review Assistant for Designers**

---

## 1. Complete Project Architecture

Critiq is designed as a modular, high-performance SaaS platform. It leverages a modern decoupled full-stack architecture to ensure scalability, ease of maintenance, and high availability.

### 1.1 High-Level Architecture Block Diagram

```
+-------------------------------------------------------------------------------+
|                               FRONTEND LAYER                                  |
|                                                                               |
|   +-----------------------+   +-----------------------+   +---------------+   |
|   |  Dashboard & History  |   |   Design Canvas UI    |   | Settings & DS |   |
|   +-----------------------+   +-----------------------+   +---------------+   |
|                                                                               |
|                      Vite React / TypeScript / Tailwind                       |
+---------------------------------------+---------------------------------------+
                                        |
                            HTTPS / JSON / Multipart
                                        |
+---------------------------------------v---------------------------------------+
|                                BACKEND LAYER                                  |
|                                                                               |
|   +-------------------+  +-------------------+  +--------------------------+  |
|   |  FastAPI Router   |  |   Auth / Session  |  |   AI Abstraction Layer   |  |
|   +---------+---------+  +---------+---------+  +------------+-------------+  |
|             |                      |                         |                |
|             |                      |                         |                |
|   +---------v---------+            |                         |                |
|   |    Rule Engine    |            |                         |                |
|   |  - UX Heuristics  |            |                         |                |
|   |  - UI Guidelines  |            |                         |                |
|   +-------------------+            |                         |                |
+--------------+---------------------|-------------------------|----------------+
               |                     |                         |
        Firestore SDK           Firebase Admin API        Provider Interface
               |                     |                         |
+--------------v---------------------v---------+      +--------v----------------+
|               PERSISTENCE LAYER              |      |        AI LAYER         |
|                                              |      |                         |
|   +-----------------------+                  |      |  +-------------------+  |
|   |  Firebase Firestore   |                  |      |  |  Gemini API (V2)  |  |
|   +-----------------------+                  |      |  +-------------------+  |
|   | Firebase Auth (Users) |                  |      |  |  Claude API (Fut) |  |
|   +-----------------------+                  |      |  +-------------------+  |
|   | Firestore Storage     |                  |      |  |  GPT-4o API (Fut) |  |
|   +-----------------------+                  |      |  +-------------------+  |
+----------------------------------------------+      +-------------------------+
```

### 1.2 System Component Breakdown

1.  **Frontend SPA (React + Vite)**: 
    *   Responsive, desktop-first workspace layout.
    *   Handles file uploads, interactive image canvas rendering (with pixel-level annotation mapping), history logs, design system definition panels, and standard dashboard telemetry.
2.  **API Gateway / Backend (FastAPI)**:
    *   High-throughput asynchronous Python web framework.
    *   Performs request validation, orchestrates the **Rule Engine**, handles design image processing, manages session contexts, and invokes the AI abstraction layer.
3.  **AI Provider Abstraction Layer**:
    *   A generic wrapper interface isolating LLM providers.
    *   Translates general audit requests into provider-specific prompts and vision contexts, guaranteeing structured JSON returns.
4.  **Rule Engine**:
    *   A deterministic logic layer that filters, customizes, and injects heuristic constraints into the AI prompts before submission to the LLM. This prevents "hallucinated criteria" and keeps feedback grounded in verified UX laws.
5.  **Memory Layer & Database (Firebase)**:
    *   **Firebase Authentication**: Handles secure login, token exchanges, and role-based middleware.
    *   **Cloud Firestore**: Persistent NoSQL database mapping users, projects, custom design systems, and audit reports.
    *   **Cloud Storage**: Holds design screenshots and visual assets securely with timed read URLs.

---

## 2. Folder Structure

Below is the production-ready directory tree for the repository, splitting duties between the client application and server services.

```
critiq/
├── .env.example                # Base environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/                        # FRONTEND (React Single Page App)
│   ├── main.tsx                # Mount point
│   ├── App.tsx                 # Base Layout & Router
│   ├── index.css               # Global styling (Tailwind imports)
│   ├── types.ts                # TypeScript global definitions
│   ├── assets/                 # SVGs and general static icons
│   ├── components/             # Reusable pure UI elements
│   │   ├── common/             # Button, Card, Dropdown, Modal, Loading
│   │   ├── canvas/             # Image Canvas, Coordinate Pin overlays
│   │   ├── review/             # Feedback Card, Metric Ring, Issue List
│   │   └── sidebar/            # Dynamic navigation system
│   ├── views/                  # Primary screen containers
│   │   ├── Dashboard.tsx       # Landing workspace, quick stats, uploads
│   │   ├── ReviewWorkspace.tsx # Interactive double-pane workspace
│   │   ├── History.tsx         # Detailed previous audit searches
│   │   ├── DesignSystems.tsx   # Custom component library standards
│   │   └── Settings.tsx        # Preference managers and API configuration
│   └── lib/                    # Helper libraries & client API definitions
│       ├── api.ts              # Fetch configurations & client request methods
│       └── firebase.ts         # Client Firebase Auth / Firestore initialization
│
├── backend/                    # BACKEND (FastAPI Core Server)
│   ├── main.py                 # ASGI entrance point
│   ├── config.py               # Environments and configurations
│   ├── requirements.txt        # Python dependency declarations
│   ├── app/
│   │   ├── api/                # Route definitions grouped by resource
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── reviews.py
│   │   │   ├── design_systems.py
│   │   │   └── rules.py
│   │   ├── core/               # Critical shared modules
│   │   │   ├── config.py       # Pydantic environment configurations
│   │   │   ├── security.py     # JWT & Firebase Token validation routines
│   │   │   └── exceptions.py   # Unified error responses
│   │   ├── services/           # Heavy lift business logic
│   │   │   ├── rule_engine.py  # Applies UX/UI filters to standard payloads
│   │   │   └── memory.py       # Context assembly and historical retrieval
│   │   ├── providers/          # AI Provider Architecture
│   │   │   ├── base.py         # AIProvider Interface
│   │   │   ├── gemini.py       # GeminiProvider (multimodal vision support)
│   │   │   ├── claude.py       # ClaudeProvider
│   │   │   └── chatgpt.py      # ChatGPTProvider
│   │   └── models/             # PyDantic Models & Firestore collection validators
│   │       ├── review.py
│   │       ├── project.py
│   │       └── user.py
│   └── tests/                  # Unit and integration tests
│       ├── test_rules.py
│       └── test_providers.py
```

---

## 3. Database Schema (Firestore)

Critiq utilizes Firestore's collection model. The schema is optimized for lightning-fast reads, minimal nesting, and simple lookup indices.

### 3.1 Collections & Documents

#### 3.1.1 `users` (Collection)
Stores user records, premium statuses, and links to current preferences.
```json
{
  "uid": "usr_78x92y1z",
  "email": "designer@example.com",
  "displayName": "Jane Designer",
  "photoURL": "https://lh3.googleusercontent.com/a/...",
  "createdAt": "2026-06-30T04:00:00Z",
  "updatedAt": "2026-06-30T04:00:00Z",
  "preferences": {
    "defaultReviewType": "UX_HEURISTICS",
    "selectedDesignSystemId": "ds_a1b2c3d4",
    "theme": "light",
    "severityNotificationThreshold": "medium"
  }
}
```

#### 3.1.2 `projects` (Collection)
Allows designers to group their uploaded designs.
```json
{
  "id": "proj_99m22k33",
  "userId": "usr_78x92y1z",
  "name": "E-Commerce Checkout Redesign",
  "description": "Improving cart conversion rates and styling inconsistencies.",
  "createdAt": "2026-06-30T04:15:00Z",
  "updatedAt": "2026-06-30T04:20:00Z",
  "reviewCount": 3
}
```

#### 3.1.3 `designSystems` (Collection)
Stores typography, sizing guides, and colors representing a user's brand parameters for AI matching.
```json
{
  "id": "ds_a1b2c3d4",
  "userId": "usr_78x92y1z",
  "name": "Critiq Primary Design System",
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "background": "#F9FAFB",
    "text": "#111827"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "scale": "major-third"
  },
  "spacing": {
    "baseGrid": 8,
    "units": [4, 8, 12, 16, 24, 32, 48, 64]
  },
  "createdAt": "2026-06-30T04:05:00Z"
}
```

#### 3.1.4 `reviews` (Collection)
The primary document logging every audit feedback. High cardinality.
```json
{
  "id": "rev_55v77w88",
  "projectId": "proj_99m22k33",
  "userId": "usr_78x92y1z",
  "name": "Checkout Step 1 - Shipping Screen",
  "imageUrl": "https://storage.googleapis.com/.../img_shipping.png",
  "reviewType": "FULL_AUDIT",
  "score": 72,
  "severity": "high",
  "summary": "Excellent layout composition, but suffers from critical accessibility and Fitts's Law spacing issues around primary CTAs.",
  "issues": [
    {
      "id": "iss_01",
      "category": "UX_RULES",
      "ruleKey": "fittss_law",
      "title": "Primary Action button touch-target too small",
      "description": "The 'Continue to Shipping' button violates Fitts's Law. It needs more padding to remain quick and easy to interact with on mobile widths.",
      "severity": "high",
      "boundingBox": {
        "x": 420,
        "y": 810,
        "width": 150,
        "height": 32
      },
      "recommendation": "Increase button height to 44px (minimum) or 48px, expanding clickable surface area."
    },
    {
      "id": "iss_02",
      "category": "UI_RULES",
      "ruleKey": "accessibility",
      "title": "Insufficient contrast ratio on small print text",
      "description": "The disclaimer font under the CTA button is #9CA3AF on #F9FAFB, creating a 2.1:1 contrast ratio.",
      "severity": "medium",
      "boundingBox": {
        "x": 400,
        "y": 860,
        "width": 190,
        "height": 18
      },
      "recommendation": "Darken font shade to #4B5563 (minimum 4.5:1 ratio) to satisfy WCAG AA standards."
    }
  ],
  "recommendations": [
    "Upgrade all inputs to utilize the 8px spacing standard.",
    "Adopt the brand primary color #3B82F6 consistently for text links."
  ],
  "createdAt": "2026-06-30T04:22:15Z"
}
```

---

## 4. API Endpoints (FastAPI)

All endpoints utilize prefix versioning `/api/v1/` and output standard JSON exceptions.

| Route | Method | Payload / Request Body | Response Format | Purpose |
|---|---|---|---|---|
| `/api/v1/auth/session` | `POST` | `{ "id_token": "firebase_jwt" }` | `{ "session_id": "string", "user": {} }` | Verifies client token & setups local session |
| `/api/v1/projects` | `GET` | *None* | `[ { "id": "string", "name": "string", ... } ]` | Fetches active projects |
| `/api/v1/projects` | `POST` | `{ "name": "string", "description": "string" }` | `{ "id": "string", "status": "created" }` | Establishes a new design project |
| `/api/v1/design-systems` | `GET` | *None* | `[ { "id": "string", "name": "string", ... } ]` | Lists user's brand configurations |
| `/api/v1/design-systems` | `POST` | `{ "name": "string", "colors": {}, ... }` | `{ "id": "string", "status": "created" }` | Creates custom design system presets |
| `/api/v1/reviews/upload` | `POST` | `multipart/form-data` (file, projectId, type) | `{ "upload_url": "string", "file_key": "string" }` | Handles multi-part visual upload to secure Storage |
| `/api/v1/reviews/analyze` | `POST` | `{ "file_key": "string", "reviewType": "UX", "designSystemId": "string" }` | `{ "review": { "id": "string", "score": 85, "issues": [] } }` | Triggers Rule Engine and passes bundle to LLM |
| `/api/v1/reviews/{id}` | `GET` | *None (URL Param)* | `{ "id": "string", "score": 80, "issues": [], ... }` | Resolves specific audit analysis with pins |
| `/api/v1/reviews/{id}` | `DELETE` | *None (URL Param)* | `{ "status": "success" }` | Destroys review asset and associated database files |

---

## 5. Component Hierarchy (React)

Critiq features a highly modular structure. Shared component architectures avoid bulk layouts and ensure seamless file sizes.

```
App.tsx (Context Providers, Dynamic App Layout, Base Routing)
│
├── Dashboard.tsx (Summary grid of metrics, quick action prompts)
│   ├── StatsOverview.tsx (Key performance indicators: AVG Score, total audits)
│   ├── QuickUploadZone.tsx (Drag-and-Drop system, file type checker)
│   └── RecentProjectsList.tsx (Visual dashboard card components)
│
├── ReviewWorkspace.tsx (Dual-Pane Layout)
│   ├── WorkspaceHeader.tsx (Analysis controller: score indicator, type toggle)
│   ├── LeftPane: ImageCanvas.tsx (Large image canvas component)
│   │   ├── CoordinatePin.tsx (Dynamic color-coded dots over visual issues)
│   │   └── BoundingBoxOverlay.tsx (Highlights layout errors interactively)
│   └── RightPane: InspectorPanel.tsx (Heuristics sidebar, collapsible tabs)
│       ├── ScoreRing.tsx (Circular metric representation)
│       ├── IssueAccordionList.tsx (Lists issues nested by severity/category)
│       │   └── IssueItem.tsx (Actionable card supporting pinpoint highlight onClick)
│       └── RecommendationList.tsx (Checklist for visual design system adherence)
│
├── History.tsx (Search, filtering dashboard for previous audits)
│   ├── HistoryFilterBar.tsx (Search query and tag-dropdown filters)
│   └── AuditGrid.tsx (Visual gallery of previously analysed assets)
│
├── DesignSystems.tsx (Color palette inputs, typography scale definitions)
│   ├── ColorPickerGroup.tsx (Hex validators for brand guidelines)
│   └── SystemRuleChecker.tsx (Rule matching toggle settings)
│
└── Settings.tsx (User profile, environment integration configs, API key status)
```

---

## 6. AI & Provider Layer Specification

Critiq decouples LLM interactions from the application core using an Object-Oriented Provider Strategy.

### 6.1 Unified Provider Class Structure

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class AIProvider(ABC):
    @abstractmethod
    async def analyze_design(self, image_bytes: bytes, rules: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Accepts raw image bytes, an array of active rules from the Rule Engine, and
        user design system metadata. Returns a structured JSON matching Critiq's Schema.
        """
        pass
```

### 6.2 Provider Classes
*   **GeminiProvider**: *Primary provider*. Harnesses standard multimodal vision models (e.g., `gemini-2.5-flash` or `gemini-2.5-pro` via the `@google/genai` interface). Passes image along with structured system instructions demanding the strict output JSON.
*   **ClaudeProvider**: Wraps Anthropic Vertex/Claude Vision API. Evaluates designs based on XML custom guidelines.
*   **ChatGPTProvider**: Integrates OpenAI’s `gpt-4o-mini` / `gpt-4o` schema parsing engine.

### 6.3 Rule Engine Definition

The Rule Engine operates as a compiler. It reads the standard Rules from user selection and bundles them into specific prompts for the Provider:

#### Group A: UX Rules
1.  **Nielsen Heuristics**: Focus on "Visibility of system status", "Match between system and real world", "Consistency and standards", and "Error prevention".
2.  **Hick's Law**: Evaluate visual complexity, item counts in menus, and user decision fatigue thresholds.
3.  **Fitts's Law**: Check target dimensions, clickable densities, margins, and distance between consecutive buttons.
4.  **Cognitive Load**: Identify unnecessary decorations, heavy text chunks, and visual distractions.

#### Group B: UI Rules
1.  **Visual Hierarchy**: Identify primary, secondary, and tertiary visual elements. Validate if eyes flow to the logical target.
2.  **Typography**: Analyze typographic scale sizes, line height spacing, readability ratios, and font family consistency.
3.  **Spacing**: Verify alignment to a standard grid scale (e.g., 8-pixel grid).
4.  **Alignment**: Review visual grid consistency (left-aligned text, centered alerts, offset grids).
5.  **Accessibility**: Confirm contrast ratios for icons and texts, checking compliance with WCAG 2.1 AA and AAA standards.

---

## 7. Response Format (JSON Schema)

Every provider **MUST** enforce structured output generation to ensure the frontend can parse the result correctly. Below is the strict JSON schema enforced by Pydantic on FastAPI and via Structured Outputs on the LLM side:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CritiqReviewOutput",
  "type": "object",
  "properties": {
    "reviewType": {
      "type": "string",
      "enum": ["UX_HEURISTICS", "UI_GUIDELINES", "FULL_AUDIT"]
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "severity": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"]
    },
    "summary": {
      "type": "string"
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "category": { "type": "string", "enum": ["UX_RULES", "UI_RULES"] },
          "ruleKey": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high"] },
          "boundingBox": {
            "type": "object",
            "properties": {
              "x": { "type": "integer", "description": "X coordinate percentage from left (0-100)" },
              "y": { "type": "integer", "description": "Y coordinate percentage from top (0-100)" },
              "width": { "type": "integer", "description": "Width percentage (0-100)" },
              "height": { "type": "integer", "description": "Height percentage (0-100)" }
            },
            "required": ["x", "y", "width", "height"]
          },
          "recommendation": { "type": "string" }
        },
        "required": ["id", "category", "ruleKey", "title", "description", "severity", "boundingBox", "recommendation"]
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["reviewType", "score", "severity", "summary", "issues", "recommendations"]
}
```

---

## 8. Development Roadmap & Sprint Plan

We propose a rapid **4-Sprint Agile Roadmap** to build a production-ready MVP of Critiq.

```
            Development Roadmap Visual Gantt
            
Sprint 1: Core Framework (Weeks 1-2)
██████████████████████████████
            Sprint 2: Rule Engine & Vision Layer (Weeks 3-4)
            ██████████████████████████████
                        Sprint 3: Canvas Interface (Weeks 5-6)
                        ██████████████████████████████
                                    Sprint 4: Integrations & Polishing (Weeks 7-8)
                                    ██████████████████████████████
```

### 8.1 Sprint 1: Foundation & Authentication (Weeks 1-2)
*   **Objective**: Build standard scaffolding, project repositories, authentication modules, and user configuration routes.
*   **Backlog Items**:
    1.  Initialize React client with Vite, Tailwind CSS, and simple landing route layouts.
    2.  Stand up the FastAPI container app structure.
    3.  Configure Firebase Auth with Google OAuth on both frontend and backend.
    4.  Establish basic Firestore data mapping configurations for `users` and `projects`.
    5.  Validate secure asset storage flow (Cloud Storage buckets with signed URL generators).

### 8.2 Sprint 2: Rule Engine & Vision AI integration (Weeks 3-4)
*   **Objective**: Launch the core AI Provider architecture and establish structured vision audits.
*   **Backlog Items**:
    1.  Implement Python abstract base class `AIProvider`.
    2.  Integrate standard `GeminiProvider` using `@google/genai` vision models.
    3.  Build the **Rule Engine** parsing active constraints (Hick's, contrast, grid alignment) into Prompt context injection blocks.
    4.  Enforce strict Pydantic parsing of JSON responses returned from Gemini.
    5.  Run integration testing suites asserting parsing stability across varying screen sizes.

### 8.3 Sprint 3: Interactive Workspace & Coordinate Mapping (Weeks 5-6)
*   **Objective**: Complete the dynamic client canvas rendering and pin inspector.
*   **Backlog Items**:
    1.  Design the dual-pane workspace inside React (`ReviewWorkspace`).
    2.  Implement `ImageCanvas` supporting mouse overlays, zoom, and interactive issue highlight rendering.
    3.  Build coordinate mapping mechanics translating percentage-based bounding box coordinates into exact highlights on the user's canvas.
    4.  Develop interactive drawer details panel synchronizing clicked dots to their active issue inspector card.
    5.  Build the custom Design System inputs screen allowing users to specify hex codes and grids.

### 8.4 Sprint 4: Figma Mock-ups, Polishing & Security Hardening (Weeks 7-8)
*   **Objective**: Implement automated mock interactions, polish transitions, and launch complete performance testing.
*   **Backlog Items**:
    1.  Add automated Figma integration mocks (allowing users to simulate import directly inside Critiq).
    2.  Incorporate elegant motion transitions (`motion/react`) across canvas elements and sidebar changes.
    3.  Establish strict Firestore Security Rules protecting cross-user document leakage.
    4.  Optimize image-loading performance using modern caching structures.
    5.  Run system integration tests verifying deployment-readiness.

---

## 9. Security Considerations

Critiq implements a defense-in-depth posture matching the stringent standards demanded by enterprise design teams:

1.  **Strict Token Authentication**:
    *   No long-lived API secrets are accessible by client actions.
    *   FastAPI backend relies exclusively on Firebase Admin SDK JWT authentication verify blocks. Every request header must pass `Authorization: Bearer <token>`.
2.  **Role & Scope Boundary checks**:
    *   No user can request database lookups for projects that do not match their verified `uid`.
    *   Firestore collections utilize rigorous custom rule schemas protecting against unauthorized read/write attempts.
3.  **Sanitized Vision Assets**:
    *   Design assets are uploaded to encrypted private GCP Cloud Storage buckets.
    *   The frontend and AI providers interact using temporary self-expiring Signed Read-Only URLs (15 minutes limit) to prevent data leaks.
4.  **AI Data Ownership Guardrails**:
    *   Gemini and alternative provider configurations explicitly toggle opt-out settings to prevent user-uploaded wireframes and screenshots from being incorporated into public LLM training data.

---

## 10. Deployment Architecture

```
                                  [ User Request ]
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          Vercel Edge Network /        │
                     │          Cloud Run Static Host        │
                     │         (Frontend SPA - Port 443)     │
                     └──────────────────┬────────────────────┘
                                        │ (HTTPS REST)
                                        ▼
                     ┌───────────────────────────────────────┐
                     │          GCP Cloud Run                │
                     │          (FastAPI API - Port 3000)    │
                     └──────┬───────────────────────┬────────┘
                            │                       │
         (Firebase Admin SDK)                       │ (Gemini REST Call)
                            ▼                       ▼
                     ┌───────────────┐      ┌───────────────┐
                     │  Firebase /   │      │  Google AI    │
                     │  Firestore DB │      │  Studio APIs  │
                     └───────────────┘      └───────────────┘
```

*   **Frontend**: Built as static bundled assets (Vite / React) and served via global Edge distributions (Vercel, Cloud Run, or Firebase Hosting) utilizing high-speed CDN delivery.
*   **Backend**: Deployed inside containerized Docker images executing in autoscaling Cloud Run serverless runtimes. Scaled-to-zero settings preserve efficiency while supporting unlimited spikes.
*   **Database**: Managed multi-region Firebase Firestore and Storage buckets. This ensures real-time synchronizations without database maintenance overheads.
