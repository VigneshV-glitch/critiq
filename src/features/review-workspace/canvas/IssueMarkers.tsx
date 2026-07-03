/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useFilterStore } from '../state/filterStore';
import { useZoomStore } from '../state/zoomStore';
import { useCanvasStore } from '../state/canvasStore';
import { useIssueStore } from '../state/issueStore';
import { markerService } from '../services/markerService';
import Marker from './Marker';
import MarkerCluster from './MarkerCluster';

interface IssueMarkersProps {
  issues: CritiqIssue[];
}

export default function IssueMarkers({ issues }: IssueMarkersProps) {
  const { scale } = useZoomStore();
  const { showMarkers } = useCanvasStore();
  const { searchQuery, severities, categories, resolvedStatus, tags, confidenceThreshold } = useFilterStore();
  const { statusMap } = useIssueStore();

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // 1. Text Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = 
          issue.title.toLowerCase().includes(query) ||
          issue.description.toLowerCase().includes(query) ||
          (issue.category && issue.category.toLowerCase().includes(query));
        
        if (!matchesText) return false;
      }

      // 2. Severity Filters
      const sev = issue.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      if (severities[sev] === false) return false;

      // 3. Category Mapping Filter
      // Note: mapping issue category string to categories object keys
      // e.g. "Visual Design" -> visualDesign, "Usability" -> usability, etc.
      const catKey = issue.category ? issue.category.toLowerCase() : '';
      let mappedCatKey = 'visualDesign';
      if (catKey.includes('usability')) mappedCatKey = 'usability';
      else if (catKey.includes('accessibility')) mappedCatKey = 'accessibility';
      else if (catKey.includes('consistency')) mappedCatKey = 'consistency';

      if (categories[mappedCatKey] === false) return false;

      // 4. Resolution Status
      const currentStatus = statusMap[issue.id] || 'unresolved';
      if (resolvedStatus === 'resolved' && currentStatus !== 'resolved') return false;
      if (resolvedStatus === 'unresolved' && currentStatus === 'resolved') return false;

      // 5. Confidence Threshold
      if (issue.confidence < confidenceThreshold) return false;

      // 6. Special Tag categories (ux, accessibility, ui, etc.)
      const isAccessibilityRelated = 
        issue.category?.toLowerCase().includes('accessibility') ||
        issue.title.toLowerCase().includes('contrast') || 
        issue.description.toLowerCase().includes('contrast');
      
      const isDesignSystemRelated =
        issue.category?.toLowerCase().includes('consistency') ||
        issue.description.toLowerCase().includes('system') ||
        issue.description.toLowerCase().includes('spacing');

      if (!tags.accessibility && isAccessibilityRelated) return false;
      if (!tags.designSystem && isDesignSystemRelated) return false;

      return true;
    });
  }, [issues, searchQuery, severities, categories, resolvedStatus, tags, confidenceThreshold, statusMap]);

  // Spatial clustering based on current zoom scale
  const clusters = useMemo(() => {
    return markerService.clusterIssues(filteredIssues, scale);
  }, [filteredIssues, scale]);

  if (!showMarkers) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {clusters.map((cluster) => {
        if (cluster.isCluster) {
          return (
            <div key={cluster.id} className="pointer-events-auto">
              <MarkerCluster cluster={cluster} />
            </div>
          );
        } else {
          // Find original index of issue in master list to display correct marker numbering
          const originalIssue = cluster.issues[0];
          const originalIndex = issues.findIndex(i => i.id === originalIssue.id) + 1;
          return (
            <div key={cluster.id} className="pointer-events-auto">
              <Marker issue={originalIssue} index={originalIndex} />
            </div>
          );
        }
      })}
    </div>
  );
}
