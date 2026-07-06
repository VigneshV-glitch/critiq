/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useMethodologyStore, methodologyActions } from './MethodologyStore';
import { ReviewConfigurationState } from './types';

interface ReviewConfigurationContextProps {
  state: ReviewConfigurationState;
  actions: typeof methodologyActions;
}

const ReviewConfigurationContext = createContext<ReviewConfigurationContextProps | undefined>(undefined);

interface ReviewConfigurationProviderProps {
  children: ReactNode;
}

export function ReviewConfigurationProvider({ children }: ReviewConfigurationProviderProps) {
  const state = useMethodologyStore();

  return (
    <ReviewConfigurationContext.Provider value={{ state, actions: methodologyActions }}>
      {children}
    </ReviewConfigurationContext.Provider>
  );
}

export function useReviewConfiguration() {
  const context = useContext(ReviewConfigurationContext);
  if (!context) {
    throw new Error('useReviewConfiguration must be used within a ReviewConfigurationProvider');
  }
  return context;
}
