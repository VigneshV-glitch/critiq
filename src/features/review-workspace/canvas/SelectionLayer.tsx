/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CritiqIssue } from '../../../lib/critiq-engine/types';
import { useSelectionStore, selectionActions } from '../state/selectionStore';

interface SelectionLayerProps {
  filteredIssues: CritiqIssue[];
}

export default function SelectionLayer({ filteredIssues }: SelectionLayerProps) {
  const { selectedIssueId } = useSelectionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside search inputs or textareas
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        selectionActions.clearSelection();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredIssues.length === 0) return;
        
        if (!selectedIssueId) {
          selectionActions.selectIssue(filteredIssues[0].id);
        } else {
          const currentIndex = filteredIssues.findIndex(i => i.id === selectedIssueId);
          const nextIndex = (currentIndex + 1) % filteredIssues.length;
          selectionActions.selectIssue(filteredIssues[nextIndex].id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredIssues.length === 0) return;

        if (!selectedIssueId) {
          selectionActions.selectIssue(filteredIssues[filteredIssues.length - 1].id);
        } else {
          const currentIndex = filteredIssues.findIndex(i => i.id === selectedIssueId);
          const prevIndex = (currentIndex - 1 + filteredIssues.length) % filteredIssues.length;
          selectionActions.selectIssue(filteredIssues[prevIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredIssues, selectedIssueId]);

  // Invisible keyboard capture hook element
  return (
    <div 
      className="sr-only" 
      tabIndex={0} 
      aria-label="Use arrow keys to navigate issues. ESC to clear selection."
    />
  );
}
