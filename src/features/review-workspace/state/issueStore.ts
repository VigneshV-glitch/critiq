/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from './storeBase';
import { IssueState, IssueStatus, IssueHistoryEntry } from './types';

const INITIAL_STATE: IssueState = {
  statusMap: {},
  historyMap: {},
};

export const issueStore = new Store<IssueState>(INITIAL_STATE);

export function useIssueStore() {
  return useStore(issueStore);
}

export const issueActions = {
  updateIssueStatus: (issueId: string, status: IssueStatus, note: string = 'Status updated by UX Architect', user: string = 'Lead Architect') => {
    const state = issueStore.getState();
    const currentStatus = state.statusMap[issueId] || 'unresolved';
    
    if (currentStatus === status) return;

    const timestamp = new Date().toISOString();
    const entry: IssueHistoryEntry = {
      timestamp,
      status,
      note,
      user,
    };

    const newHistory = [...(state.historyMap[issueId] || []), entry];

    issueStore.setState({
      statusMap: {
        ...state.statusMap,
        [issueId]: status,
      },
      historyMap: {
        ...state.historyMap,
        [issueId]: newHistory,
      },
    });
  },
  resetIssues: () => {
    issueStore.setState(INITIAL_STATE);
  }
};
export function getIssueStatus(issueId: string): IssueStatus {
  return issueStore.getState().statusMap[issueId] || 'unresolved';
}
