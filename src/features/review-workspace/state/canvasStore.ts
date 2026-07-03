/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store, useStore } from './storeBase';
import { CanvasState } from './types';

const INITIAL_STATE: CanvasState = {
  showBoundingBoxes: true,
  showLabels: true,
  showMarkers: true,
  isPanning: false,
  panOffset: { x: 0, y: 0 },
  viewportSize: { width: 800, height: 600 },
  imageSize: { width: 1200, height: 800 },
};

export const canvasStore = new Store<CanvasState>(INITIAL_STATE);

export function useCanvasStore() {
  return useStore(canvasStore);
}

export const canvasActions = {
  toggleBoundingBoxes: () => {
    const current = canvasStore.getState().showBoundingBoxes;
    canvasStore.setState({ showBoundingBoxes: !current });
  },
  toggleLabels: () => {
    const current = canvasStore.getState().showLabels;
    canvasStore.setState({ showLabels: !current });
  },
  toggleMarkers: () => {
    const current = canvasStore.getState().showMarkers;
    canvasStore.setState({ showMarkers: !current });
  },
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    const nextOffset = typeof offset === 'function' ? offset(canvasStore.getState().panOffset) : offset;
    canvasStore.setState({ panOffset: nextOffset });
  },
  setIsPanning: (isPanning: boolean) => {
    canvasStore.setState({ isPanning });
  },
  setViewportSize: (width: number, height: number) => {
    canvasStore.setState({ viewportSize: { width, height } });
  },
  setImageSize: (width: number, height: number) => {
    canvasStore.setState({ imageSize: { width, height } });
  },
  resetPan: () => {
    canvasStore.setState({ panOffset: { x: 0, y: 0 } });
  }
};
