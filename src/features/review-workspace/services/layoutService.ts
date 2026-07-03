/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScreenDimensionPreset {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const SCREEN_PRESETS: Record<string, ScreenDimensionPreset> = {
  Web: { name: 'Desktop Web (16:9)', width: 1440, height: 900, aspectRatio: '16:9' },
  Mobile: { name: 'Mobile App (9:19.5)', width: 390, height: 844, aspectRatio: '9:19.5' },
  Tablet: { name: 'Tablet (4:3)', width: 1024, height: 768, aspectRatio: '4:3' },
};

export const layoutService = {
  /**
   * Determine suitable standard dimensions for a classification screen type.
   */
  getDimensionsByPlatform: (platform?: string): { width: number; height: number } => {
    const cleanPlatform = (platform || 'Web').toLowerCase();
    if (cleanPlatform.includes('mobile') || cleanPlatform.includes('android') || cleanPlatform.includes('ios')) {
      return { width: SCREEN_PRESETS.Mobile.width, height: SCREEN_PRESETS.Mobile.height };
    }
    if (cleanPlatform.includes('tablet') || cleanPlatform.includes('ipad')) {
      return { width: SCREEN_PRESETS.Tablet.width, height: SCREEN_PRESETS.Tablet.height };
    }
    return { width: SCREEN_PRESETS.Web.width, height: SCREEN_PRESETS.Web.height };
  }
};
