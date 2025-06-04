/**
 * @fileoverview Branding and theme types
 * @module @agent-desktop/types/app/branding
 */

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Brand colors configuration
 */
export interface BrandColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent?: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

/**
 * Typography configuration
 */
export interface Typography {
  readonly fontFamily: string;
  readonly fontSize: {
    readonly xs: string;
    readonly sm: string;
    readonly base: string;
    readonly lg: string;
    readonly xl: string;
    readonly '2xl': string;
  };
  readonly fontWeight: {
    readonly light: number;
    readonly normal: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
  };
}

/**
 * Brand assets
 */
export interface BrandAssets {
  readonly logo: LogoAssets;
  readonly favicon: string;
  readonly illustrations?: Record<string, string>;
}

/**
 * Logo asset variants
 */
export interface LogoAssets {
  readonly primary: string;
  readonly secondary?: string;
  readonly mark?: string;
  readonly white?: string;
  readonly dark?: string;
}