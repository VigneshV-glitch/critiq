/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenType, PlatformType } from './screenModel';

export class ScreenClassifier {
  /**
   * Safe normalization function to map string values to valid ScreenType enums
   */
  public static normalizeScreenType(typeStr: string): ScreenType {
    const s = String(typeStr || '').trim().toLowerCase();
    
    // Check for popup/modal overlay first, as overlays take precedence over the background screen types
    if (s.includes('modal') || s.includes('popover') || s.includes('popup')) return ScreenType.MODAL;
    if (s.includes('dialog') || s.includes('alert')) return ScreenType.DIALOG;

    if (s.includes('login') || s.includes('signin') || s.includes('sign in')) return ScreenType.LOGIN;
    if (s.includes('register') || s.includes('signup') || s.includes('sign up') || s.includes('registration')) return ScreenType.REGISTRATION;
    if (s.includes('dashboard') || s.includes('home') || s.includes('overview')) return ScreenType.DASHBOARD;
    if (s.includes('landing')) return ScreenType.LANDING_PAGE;
    if (s.includes('checkout') || s.includes('cart') || s.includes('payment') || s.includes('pay')) return ScreenType.CHECKOUT;
    if (s.includes('setting') || s.includes('preference') || s.includes('configuration')) return ScreenType.SETTINGS;
    if (s.includes('profile') || s.includes('account') || s.includes('user details')) return ScreenType.PROFILE;
    if (s.includes('analytic') || s.includes('chart') || s.includes('graph') || s.includes('report')) return ScreenType.ANALYTICS;
    if (s.includes('listing') || s.includes('catalog') || s.includes('search result') || s.includes('shop')) return ScreenType.PRODUCT_LISTING;
    if (s.includes('detail') || s.includes('product page') || s.includes('item view') || s.includes('product-detail')) return ScreenType.PRODUCT_DETAIL;
    if (s.includes('wizard') || s.includes('stepper') || s.includes('step')) return ScreenType.WIZARD;
    if (s.includes('form') || s.includes('feedback form') || s.includes('survey')) return ScreenType.FORM;
    if (s.includes('mobile')) return ScreenType.MOBILE_SCREEN;
    if (s.includes('desktop')) return ScreenType.DESKTOP_SCREEN;
    if (s.includes('tablet')) return ScreenType.TABLET_SCREEN;
    return ScreenType.UNKNOWN;
  }

  /**
   * Safe normalization function to map string values to valid PlatformType enums
   */
  public static normalizePlatform(platformStr: string): PlatformType {
    const p = String(platformStr || '').trim().toLowerCase();
    if (p.includes('responsive')) return PlatformType.RESPONSIVE;
    if (p.includes('mobile') || p.includes('phone') || p.includes('ios') || p.includes('android')) return PlatformType.MOBILE;
    if (p.includes('tablet') || p.includes('ipad')) return PlatformType.TABLET;
    if (p.includes('desktop') || p.includes('mac') || p.includes('windows')) return PlatformType.DESKTOP;
    if (p.includes('web') || p.includes('browser')) return PlatformType.WEB;
    return PlatformType.WEB;
  }
}
