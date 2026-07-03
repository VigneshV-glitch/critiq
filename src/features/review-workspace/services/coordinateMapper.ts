/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const coordinateMapper = {
  /**
   * Convert percentage-based coordinates (0-100) to actual image coordinates in pixels.
   */
  percentToImagePixels: (percentX: number, percentY: number, imageWidth: number, imageHeight: number): Point => {
    return {
      x: (percentX / 100) * imageWidth,
      y: (percentY / 100) * imageHeight,
    };
  },

  /**
   * Convert image pixel coordinates to canvas coordinate space (applies zoom scale and pan offset).
   */
  imagePixelsToCanvas: (
    imageX: number,
    imageY: number,
    scale: number,
    panOffset: Point
  ): Point => {
    return {
      x: imageX * scale + panOffset.x,
      y: imageY * scale + panOffset.y,
    };
  },

  /**
   * Directly maps percent coordinates (0-100) to styled CSS positions relative to a container of a given size.
   */
  percentToCSSStyles: (
    rect: Rect,
    scale: number,
    panOffset: Point,
    imageWidth: number,
    imageHeight: number
  ) => {
    // Calculates left, top, width, height in pixels
    const left = (rect.x / 100) * imageWidth * scale + panOffset.x;
    const top = (rect.y / 100) * imageHeight * scale + panOffset.y;
    const width = (rect.width / 100) * imageWidth * scale;
    const height = (rect.height / 100) * imageHeight * scale;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  },

  /**
   * Translates a click inside the viewport back into percentage coordinates (useful for user custom annotations!).
   */
  viewportClickToPercent: (
    clickX: number,
    clickY: number,
    viewportRect: DOMRect,
    scale: number,
    panOffset: Point,
    imageWidth: number,
    imageHeight: number
  ): Point => {
    const rx = clickX - viewportRect.left - panOffset.x;
    const ry = clickY - viewportRect.top - panOffset.y;
    
    // Reverse scale
    const originalImageX = rx / scale;
    const originalImageY = ry / scale;

    // Convert back to percentage (0 - 100)
    const percentX = Math.min(100, Math.max(0, (originalImageX / imageWidth) * 100));
    const percentY = Math.min(100, Math.max(0, (originalImageY / imageHeight) * 100));

    return { x: percentX, y: percentY };
  },
};
