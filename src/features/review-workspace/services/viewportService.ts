/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const viewportService = {
  /**
   * Calculates the scale factor to fit an image of width/height perfectly into a viewport of width/height with padding.
   */
  calculateFitScale: (
    viewportWidth: number,
    viewportHeight: number,
    imageWidth: number,
    imageHeight: number,
    padding: number = 40
  ): number => {
    const availableWidth = Math.max(100, viewportWidth - padding * 2);
    const availableHeight = Math.max(100, viewportHeight - padding * 2);
    
    const scaleX = availableWidth / imageWidth;
    const scaleY = availableHeight / imageHeight;
    
    // Return the more restrictive scale bounded between 10% and 500%
    return Math.min(5.0, Math.max(0.1, Math.min(scaleX, scaleY)));
  },

  /**
   * Returns a pan offset that centers the image inside the viewport at a given scale.
   */
  calculateCenterOffset: (
    viewportWidth: number,
    viewportHeight: number,
    imageWidth: number,
    imageHeight: number,
    scale: number
  ) => {
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    
    return {
      x: (viewportWidth - scaledWidth) / 2,
      y: (viewportHeight - scaledHeight) / 2,
    };
  },

  /**
   * Helper to check if a rect overlaps with the current viewport bounds.
   */
  isElementVisibleInViewport: (
    elemX: number,
    elemY: number,
    elemW: number,
    elemH: number,
    viewportW: number,
    viewportH: number
  ): boolean => {
    return (
      elemX + elemW >= 0 &&
      elemX <= viewportW &&
      elemY + elemH >= 0 &&
      elemY <= viewportH
    );
  }
};
