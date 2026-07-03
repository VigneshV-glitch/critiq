/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueStatus = 'unresolved' | 'resolved' | 'ignored' | 'needs_review' | 'accepted' | 'rejected' | 'reopened';

export interface IssueHistoryEntry {
  timestamp: string;
  status: IssueStatus;
  note?: string;
  user?: string;
}

export interface IssueState {
  // Map of issueId -> status
  statusMap: Record<string, IssueStatus>;
  // Map of issueId -> history of status transitions
  historyMap: Record<string, IssueHistoryEntry[]>;
}

export interface FilterState {
  searchQuery: string;
  severities: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  categories: Record<string, boolean>; // e.g. usability, accessibility, consistency, visualDesign, etc.
  resolvedStatus: 'all' | 'resolved' | 'unresolved';
  tags: {
    ux: boolean;
    accessibility: boolean;
    ui: boolean;
    visual: boolean;
    mobile: boolean;
    designSystem: boolean;
  };
  confidenceThreshold: number; // 0 to 100
}

export interface CanvasState {
  showBoundingBoxes: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  isPanning: boolean;
  panOffset: { x: number; y: number };
  viewportSize: { width: number; height: number };
  imageSize: { width: number; height: number };
}

export interface ZoomState {
  scale: number; // e.g. 1.0 (100%), 2.0 (200%)
}

export interface SelectionState {
  selectedIssueId: string | null;
  hoveredIssueId: string | null;
}
