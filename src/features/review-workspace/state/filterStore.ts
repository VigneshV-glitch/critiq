/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from './storeBase';
import { FilterState } from './types';

const INITIAL_STATE: FilterState = {
  searchQuery: '',
  severities: {
    critical: true,
    high: true,
    medium: true,
    low: true,
  },
  categories: {
    visualDesign: true,
    usability: true,
    accessibility: true,
    consistency: true,
  },
  resolvedStatus: 'all',
  tags: {
    ux: true,
    accessibility: true,
    ui: true,
    visual: true,
    mobile: true,
    designSystem: true,
  },
  confidenceThreshold: 0,
};

export const filterStore = new Store<FilterState>(INITIAL_STATE);

export function useFilterStore() {
  return useStore(filterStore);
}

export const filterActions = {
  setSearchQuery: (query: string) => {
    filterStore.setState({ searchQuery: query });
  },
  toggleSeverity: (severity: 'critical' | 'high' | 'medium' | 'low') => {
    const current = filterStore.getState().severities;
    filterStore.setState({
      severities: {
        ...current,
        [severity]: !current[severity],
      },
    });
  },
  toggleCategory: (category: string) => {
    const current = filterStore.getState().categories;
    filterStore.setState({
      categories: {
        ...current,
        [category]: !current[category],
      },
    });
  },
  setResolvedStatus: (status: 'all' | 'resolved' | 'unresolved') => {
    filterStore.setState({ resolvedStatus: status });
  },
  toggleTag: (tag: keyof FilterState['tags']) => {
    const current = filterStore.getState().tags;
    filterStore.setState({
      tags: {
        ...current,
        [tag]: !current[tag],
      },
    });
  },
  setConfidenceThreshold: (threshold: number) => {
    filterStore.setState({ confidenceThreshold: threshold });
  },
  resetFilters: () => {
    filterStore.setState(INITIAL_STATE);
  },
};
