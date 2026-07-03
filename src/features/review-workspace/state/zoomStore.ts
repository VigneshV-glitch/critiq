/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from './storeBase';
import { ZoomState } from './types';

const INITIAL_STATE: ZoomState = {
  scale: 1.0,
};

export const zoomStore = new Store<ZoomState>(INITIAL_STATE);

export function useZoomStore() {
  return useStore(zoomStore);
}

export const zoomActions = {
  setScale: (scale: number) => {
    // Keep zoom between 10% and 800%
    const boundedScale = Math.min(8.0, Math.max(0.1, scale));
    zoomStore.setState({ scale: boundedScale });
  },
  zoomIn: (factor: number = 1.2) => {
    const current = zoomStore.getState().scale;
    zoomActions.setScale(current * factor);
  },
  zoomOut: (factor: number = 1.2) => {
    const current = zoomStore.getState().scale;
    zoomActions.setScale(current / factor);
  },
  resetZoom: () => {
    zoomStore.setState({ scale: 1.0 });
  },
};
