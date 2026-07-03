/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from './storeBase';
import { SelectionState } from './types';

const INITIAL_STATE: SelectionState = {
  selectedIssueId: null,
  hoveredIssueId: null,
};

export const selectionStore = new Store<SelectionState>(INITIAL_STATE);

export function useSelectionStore() {
  return useStore(selectionStore);
}

export const selectionActions = {
  selectIssue: (issueId: string | null) => {
    selectionStore.setState({ selectedIssueId: issueId });
    if (issueId) {
      // Automatically scroll corresponding sidebar list item if any
      const element = document.getElementById(`issue-card-${issueId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  },
  hoverIssue: (issueId: string | null) => {
    selectionStore.setState({ hoveredIssueId: issueId });
  },
  clearSelection: () => {
    selectionStore.setState({ selectedIssueId: null, hoveredIssueId: null });
  },
};
