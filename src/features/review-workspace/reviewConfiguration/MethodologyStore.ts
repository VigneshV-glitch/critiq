/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from '../state/storeBase';
import { ReviewConfigurationState, AuditThresholds, AdvancedOptionsState } from './types';
import { METHODOLOGIES, MethodologyRegistry } from './ReviewMethodology';

const DEFAULT_METHODOLOGY = METHODOLOGIES[0];

const INITIAL_STATE: ReviewConfigurationState = {
  selectedMethodologyId: DEFAULT_METHODOLOGY.id,
  selectedProviderId: 'gemini',
  thresholds: { ...DEFAULT_METHODOLOGY.defaultConfiguration },
  advancedOptions: {
    experimentalRules: false,
    deepAnalysisMode: false,
    strictAccessibilityMode: false,
    performanceOptimizations: true,
    customJsonOutput: false,
    verboseReasoning: false,
    developerDiagnostics: false,
    providerDebugInfo: false,
  },
};

// Safe local storage persistence helper
const STORAGE_KEY = 'critiq_review_config_v2';

function loadPersistedState(): ReviewConfigurationState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure validity
      if (parsed.selectedMethodologyId && parsed.thresholds && parsed.advancedOptions) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[MethodologyStore] Failed to load persisted configuration:', err);
  }
  return INITIAL_STATE;
}

export const methodologyStore = new Store<ReviewConfigurationState>(loadPersistedState());

// Subscribe to automatically persist configuration changes
methodologyStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[MethodologyStore] Failed to persist configuration:', err);
  }
});

export function useMethodologyStore() {
  return useStore(methodologyStore);
}

export const methodologyActions = {
  selectMethodology: (id: string) => {
    const methodology = MethodologyRegistry.getById(id) || DEFAULT_METHODOLOGY;
    methodologyStore.setState({
      selectedMethodologyId: id,
      thresholds: { ...methodology.defaultConfiguration },
    });
  },

  selectProvider: (providerId: string) => {
    methodologyStore.setState({ selectedProviderId: providerId });
  },

  updateThresholds: (update: Partial<AuditThresholds>) => {
    methodologyStore.setState((state) => ({
      thresholds: { ...state.thresholds, ...update },
    }));
  },

  resetThresholds: () => {
    const state = methodologyStore.getState();
    const methodology = MethodologyRegistry.getById(state.selectedMethodologyId) || DEFAULT_METHODOLOGY;
    methodologyStore.setState({
      thresholds: { ...methodology.defaultConfiguration },
    });
  },

  updateAdvancedOptions: (update: Partial<AdvancedOptionsState>) => {
    methodologyStore.setState((state) => ({
      advancedOptions: { ...state.advancedOptions, ...update },
    }));
  },

  resetAll: () => {
    methodologyStore.setState({
      selectedMethodologyId: DEFAULT_METHODOLOGY.id,
      selectedProviderId: 'gemini',
      thresholds: { ...DEFAULT_METHODOLOGY.defaultConfiguration },
      advancedOptions: { ...INITIAL_STATE.advancedOptions },
    });
  },
};
