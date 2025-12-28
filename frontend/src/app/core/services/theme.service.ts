import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OverlayContainer } from '@angular/cdk/overlay';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  animations: boolean;
}

/**
 * Theme service that manages application theming including dark/light mode,
 * colors, typography, and user preferences.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'travel-admin-theme';
  private readonly DARK_THEME_CLASS = 'dark-theme';
  private readonly LIGHT_THEME_CLASS = 'light-theme';

  private currentTheme$ = new BehaviorSubject<ThemeConfig>(this.getDefaultTheme());
  public isDarkTheme$ = new BehaviorSubject<boolean>(false);

  // Public observables
  public readonly theme$ = this.currentTheme$.asObservable();
  public readonly isDarkTheme = this.isDarkTheme$.asObservable();

  // Available themes
  private readonly availableThemes: { [key: string]: Partial<ThemeConfig> } = {
    'indigo-pink': {
      primaryColor: '#3f51b5',
      accentColor: '#e91e63'
    },
    'deeppurple-amber': {
      primaryColor: '#673ab7',
      accentColor: '#ffc107'
    },
    'pink-bluegrey': {
      primaryColor: '#e91e63',
      accentColor: '#607d8b'
    },
    'purple-green': {
      primaryColor: '#9c27b0',
      accentColor: '#4caf50'
    }
  };

  constructor(private overlayContainer: OverlayContainer) {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Initialize theme from stored preferences or defaults
   */
  initializeTheme(): void {
    const storedTheme = this.getStoredTheme();
    if (storedTheme) {
      this.setTheme(storedTheme);
    } else {
      this.applyTheme(this.currentTheme$.value);
    }
  }

  /**
   * Set the current theme
   */
  setTheme(themeConfig: Partial<ThemeConfig>): void {
    const newTheme: ThemeConfig = {
      ...this.currentTheme$.value,
      ...themeConfig
    };

    this.currentTheme$.next(newTheme);
    this.applyTheme(newTheme);
    this.storeTheme(newTheme);
  }

  /**
   * Toggle between light and dark mode
   */
  toggleDarkMode(): void {
    const currentTheme = this.currentTheme$.value;
    const newMode: ThemeMode = currentTheme.mode === 'dark' ? 'light' : 'dark';

    this.setTheme({ mode: newMode });
  }

  /**
   * Set theme mode (light, dark, or auto)
   */
  setThemeMode(mode: ThemeMode): void {
    this.setTheme({ mode });
  }

  /**
   * Set predefined theme by name
   */
  setPredefinedTheme(themeName: string): void {
    const themeConfig = this.availableThemes[themeName];
    if (themeConfig) {
      this.setTheme(themeConfig);
    }
  }

  /**
   * Set primary color
   */
  setPrimaryColor(color: string): void {
    this.setTheme({ primaryColor: color });
  }

  /**
   * Set accent color
   */
  setAccentColor(color: string): void {
    this.setTheme({ accentColor: color });
  }

  /**
   * Set font family
   */
  setFontFamily(fontFamily: string): void {
    this.setTheme({ fontFamily });
  }

  /**
   * Set font size
   */
  setFontSize(fontSize: number): void {
    this.setTheme({ fontSize });
  }

  /**
   * Set border radius
   */
  setBorderRadius(borderRadius: number): void {
    this.setTheme({ borderRadius });
  }

  /**
   * Toggle animations
   */
  toggleAnimations(): void {
    const currentTheme = this.currentTheme$.value;
    this.setTheme({ animations: !currentTheme.animations });
  }

  /**
   * Get current theme configuration
   */
  getCurrentTheme(): ThemeConfig {
    return this.currentTheme$.value;
  }

  /**
   * Get available theme names
   */
  getAvailableThemes(): string[] {
    return Object.keys(this.availableThemes);
  }

  /**
   * Reset theme to defaults
   */
  resetTheme(): void {
    const defaultTheme = this.getDefaultTheme();
    this.setTheme(defaultTheme);
  }

  /**
   * Check if dark mode is currently active
   */
  isDarkModeActive(): boolean {
    return this.isDarkTheme$.value;
  }

  // Private methods

  /**
   * Apply the theme to the document
   */
  private applyTheme(theme: ThemeConfig): void {
    const isDark = this.shouldUseDarkMode(theme.mode);

    // Update dark theme state
    this.isDarkTheme$.next(isDark);

    // Apply theme classes to body
    document.body.classList.remove(this.DARK_THEME_CLASS, this.LIGHT_THEME_CLASS);
    document.body.classList.add(isDark ? this.DARK_THEME_CLASS : this.LIGHT_THEME_CLASS);

    // Apply theme classes to overlay container for modals/dialogs
    const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;
    overlayContainerClasses.remove(this.DARK_THEME_CLASS, this.LIGHT_THEME_CLASS);
    overlayContainerClasses.add(isDark ? this.DARK_THEME_CLASS : this.LIGHT_THEME_CLASS);

    // Apply custom CSS properties
    this.applyCustomProperties(theme, isDark);
  }

  /**
   * Apply custom CSS properties
   */
  private applyCustomProperties(theme: ThemeConfig, isDark: boolean): void {
    const root = document.documentElement;

    // Color properties
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);

    // Typography properties
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--font-size-base', `${theme.fontSize}px`);

    // Layout properties
    root.style.setProperty('--border-radius', `${theme.borderRadius}px`);

    // Theme-specific properties
    if (isDark) {
      root.style.setProperty('--background-color', '#303030');
      root.style.setProperty('--surface-color', '#424242');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary-color', '#aaaaaa');
      root.style.setProperty('--border-color', '#555555');
    } else {
      root.style.setProperty('--background-color', '#fafafa');
      root.style.setProperty('--surface-color', '#ffffff');
      root.style.setProperty('--text-color', '#212121');
      root.style.setProperty('--text-secondary-color', '#757575');
      root.style.setProperty('--border-color', '#e0e0e0');
    }

    // Animation properties
    if (theme.animations) {
      root.style.setProperty('--animation-duration', '300ms');
      root.style.setProperty('--animation-timing', 'cubic-bezier(0.4, 0.0, 0.2, 1)');
    } else {
      root.style.setProperty('--animation-duration', '0ms');
      root.style.setProperty('--animation-timing', 'none');
    }
  }

  /**
   * Determine if dark mode should be used based on the mode setting
   */
  private shouldUseDarkMode(mode: ThemeMode): boolean {
    switch (mode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'auto':
        return this.isSystemDarkMode();
      default:
        return false;
    }
  }

  /**
   * Check if system prefers dark mode
   */
  private isSystemDarkMode(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Setup listener for system theme changes
   */
  private setupSystemThemeListener(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', () => {
        const currentTheme = this.currentTheme$.value;
        if (currentTheme.mode === 'auto') {
          this.applyTheme(currentTheme);
        }
      });
    }
  }

  /**
   * Get default theme configuration
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      mode: 'auto',
      primaryColor: '#3f51b5',
      accentColor: '#e91e63',
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      fontSize: 14,
      borderRadius: 4,
      animations: true
    };
  }

  /**
   * Store theme in localStorage
   */
  private storeTheme(theme: ThemeConfig): void {
    try {
      localStorage.setItem(this.THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      console.warn('Failed to store theme preferences:', error);
    }
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): ThemeConfig | null {
    try {
      const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultTheme(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
    return null;
  }
}