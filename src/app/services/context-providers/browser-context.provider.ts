import { Injectable } from '@angular/core';
import { BrowserContext } from '../../models/logging.model';

/**
 * Provider for browser-specific context information.
 * Captures user agent, viewport, performance data, and other browser-related metadata.
 */
@Injectable({
  providedIn: 'root',
})
export class BrowserContextProvider {
  
  /**
   * Capture comprehensive browser context information
   */
  getContext(): BrowserContext {
    return {
      userAgent: this.getUserAgent(),
      viewport: this.getViewportInfo(),
      url: this.getCurrentUrl(),
      timestamp: Date.now(),
      performance: this.getPerformanceData(),
    };
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    return navigator.userAgent || 'Unknown';
  }

  /**
   * Get current viewport dimensions
   */
  private getViewportInfo(): { width: number; height: number } {
    return {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    };
  }

  /**
   * Get current URL
   */
  private getCurrentUrl(): string {
    return window.location.href || '';
  }

  /**
   * Gather performance metrics if available
   */
  private getPerformanceData() {
    if (typeof performance === 'undefined') {
      return undefined;
    }

    const performanceData: BrowserContext['performance'] = {};

    // Memory information (Chrome-specific)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        performanceData.memory = {
          usedJSHeapSize: memory.usedJSHeapSize || 0,
          totalJSHeapSize: memory.totalJSHeapSize || 0,
          jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
        };
      }
    }

    // Navigation timing information
    if (performance.timing) {
      performanceData.timing = {
        navigationStart: performance.timing.navigationStart || 0,
        loadEventEnd: performance.timing.loadEventEnd || 0,
      };
    }

    return Object.keys(performanceData).length > 0 ? performanceData : undefined;
  }

  /**
   * Get additional browser capabilities and features
   */
  getBrowserCapabilities(): Record<string, any> {
    return {
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      language: navigator.language,
      languages: navigator.languages || [],
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      deviceMemory: (navigator as any).deviceMemory || undefined,
      connection: this.getConnectionInfo(),
      screen: this.getScreenInfo(),
    };
  }

  /**
   * Get network connection information if available
   */
  private getConnectionInfo(): Record<string, any> | undefined {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (!connection) {
      return undefined;
    }

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  /**
   * Get screen information
   */
  private getScreenInfo(): Record<string, any> {
    return {
      width: screen.width || 0,
      height: screen.height || 0,
      availWidth: screen.availWidth || 0,
      availHeight: screen.availHeight || 0,
      colorDepth: screen.colorDepth || 0,
      pixelDepth: screen.pixelDepth || 0,
    };
  }

  /**
   * Check if running in development mode
   */
  isDevelopmentMode(): boolean {
    return !!(window as any).ng?.probe || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }

  /**
   * Get browser-specific error information
   */
  getBrowserErrorContext(error?: Error): Record<string, any> {
    const context: Record<string, any> = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (error) {
      context.errorName = error.name;
      context.errorMessage = error.message;
      context.errorStack = error.stack;
    }

    // Add document state
    context.documentState = {
      readyState: document.readyState,
      visibilityState: document.visibilityState,
      hidden: document.hidden,
    };

    return context;
  }
}