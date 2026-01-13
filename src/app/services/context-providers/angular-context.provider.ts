import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AngularContext } from '../../models/logging.model';
import { filter, map } from 'rxjs/operators';

/**
 * Provider for Angular-specific context information.
 * Captures component and route context for Angular errors and debugging.
 */
@Injectable({
  providedIn: 'root',
})
export class AngularContextProvider {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  
  private currentRoute: string | undefined;
  private currentRouteParams: Record<string, any> = {};
  private changeDetectionCycle = 0;

  constructor() {
    this.initializeRouteTracking();
  }

  /**
   * Capture comprehensive Angular context information
   */
  getContext(): AngularContext {
    return {
      component: this.getCurrentComponent(),
      route: this.getCurrentRoute(),
      routeParams: this.getCurrentRouteParams(),
      changeDetectionCycle: this.getChangeDetectionCycle(),
      errorBoundary: this.getCurrentErrorBoundary(),
    };
  }

  /**
   * Initialize route tracking to maintain current route state
   */
  private initializeRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd)
      )
      .subscribe(event => {
        this.currentRoute = event.url;
        this.updateRouteParams();
      });
  }

  /**
   * Get current component name from route or URL
   */
  private getCurrentComponent(): string | undefined {
    // Try to extract component name from current route
    const url = this.router.url;
    
    if (!url || url === '/') {
      return 'AppComponent';
    }

    // Extract the main route segment
    const segments = url.split('/').filter(segment => segment.length > 0);
    
    if (segments.length === 0) {
      return 'HomeComponent';
    }

    // Convert route segment to component name convention
    const mainSegment = segments[0];
    return this.routeToComponentName(mainSegment);
  }

  /**
   * Convert route segment to Angular component name convention
   */
  private routeToComponentName(route: string): string {
    // Convert kebab-case to PascalCase and add Component suffix
    const pascalCase = route
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    return `${pascalCase}Component`;
  }

  /**
   * Get current route URL
   */
  private getCurrentRoute(): string | undefined {
    return this.currentRoute || this.router.url;
  }

  /**
   * Get current route parameters
   */
  private getCurrentRouteParams(): Record<string, any> {
    return { ...this.currentRouteParams };
  }

  /**
   * Update route parameters from activated route
   */
  private updateRouteParams(): void {
    try {
      // Get parameters from activated route
      let route = this.activatedRoute;
      const params: Record<string, any> = {};

      // Traverse the route tree to collect all parameters
      while (route) {
        if (route.snapshot.params) {
          Object.assign(params, route.snapshot.params);
        }
        if (route.snapshot.queryParams) {
          Object.assign(params, route.snapshot.queryParams);
        }
        route = route.firstChild!;
      }

      this.currentRouteParams = params;
    } catch (error) {
      // Silently handle route parameter extraction errors
      this.currentRouteParams = {};
    }
  }

  /**
   * Get current change detection cycle count
   */
  private getChangeDetectionCycle(): number {
    return this.changeDetectionCycle;
  }

  /**
   * Increment change detection cycle counter
   */
  incrementChangeDetectionCycle(): void {
    this.changeDetectionCycle++;
  }

  /**
   * Get current error boundary context
   */
  private getCurrentErrorBoundary(): string | undefined {
    // In Angular, error boundaries are typically implemented as components
    // This would need to be set by error boundary components when they catch errors
    return undefined;
  }

  /**
   * Set error boundary context (to be called by error boundary components)
   */
  setErrorBoundary(boundaryName: string): void {
    // This would be called by error boundary components to set context
    // For now, we'll store it in a simple property
    (this as any)._currentErrorBoundary = boundaryName;
  }

  /**
   * Get detailed Angular application context
   */
  getApplicationContext(): Record<string, any> {
    return {
      angularVersion: this.getAngularVersion(),
      routerState: this.getRouterState(),
      applicationState: this.getApplicationState(),
      performanceMetrics: this.getAngularPerformanceMetrics(),
    };
  }

  /**
   * Get Angular version information
   */
  private getAngularVersion(): string | undefined {
    try {
      // Try to get Angular version from global ng object
      const ng = (window as any).ng;
      if (ng && ng.version) {
        return ng.version.full;
      }
      
      // Fallback: try to detect from build artifacts or package info
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Get current router state information
   */
  private getRouterState(): Record<string, any> {
    return {
      url: this.router.url,
      routerState: this.router.routerState.snapshot.url,
      navigationId: (this.router as any).navigationId || 0,
      isNavigating: (this.router as any).navigating || false,
    };
  }

  /**
   * Get general application state
   */
  private getApplicationState(): Record<string, any> {
    return {
      changeDetectionStrategy: 'OnPush', // Project uses OnPush everywhere
      zonelessChangeDetection: true, // Project uses zoneless change detection
      timestamp: Date.now(),
    };
  }

  /**
   * Get Angular-specific performance metrics
   */
  private getAngularPerformanceMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
      changeDetectionCycles: this.changeDetectionCycle,
    };

    // Add performance marks if available
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      try {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const navigation = navigationEntries[0] as PerformanceNavigationTiming;
          metrics.navigationTiming = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          };
        }
      } catch (error) {
        // Silently handle performance API errors
      }
    }

    return metrics;
  }

  /**
   * Get context for Angular error reporting
   */
  getErrorContext(error?: Error): Record<string, any> {
    const context = this.getContext();
    
    const errorContext: Record<string, any> = {
      ...context,
      application: this.getApplicationContext(),
      timestamp: Date.now(),
    };

    if (error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };

      // Try to extract Angular-specific error information
      if (error.message.includes('ExpressionChangedAfterItHasBeenCheckedError')) {
        errorContext.angularErrorType = 'ExpressionChangedAfterItHasBeenChecked';
      } else if (error.message.includes('Cannot read property') || error.message.includes('Cannot read properties')) {
        errorContext.angularErrorType = 'PropertyAccess';
      } else if (error.message.includes('inject')) {
        errorContext.angularErrorType = 'DependencyInjection';
      }
    }

    return errorContext;
  }

  /**
   * Track component lifecycle events
   */
  trackComponentLifecycle(componentName: string, lifecycle: string): void {
    // This could be used by components to track their lifecycle events
    // Useful for debugging component-related issues
    const timestamp = Date.now();
    
    // Store in a simple tracking structure (could be enhanced with a proper store)
    if (!(window as any)._angularLifecycleTracking) {
      (window as any)._angularLifecycleTracking = [];
    }
    
    (window as any)._angularLifecycleTracking.push({
      component: componentName,
      lifecycle,
      timestamp,
    });

    // Keep only the last 50 lifecycle events to prevent memory leaks
    if ((window as any)._angularLifecycleTracking.length > 50) {
      (window as any)._angularLifecycleTracking = (window as any)._angularLifecycleTracking.slice(-50);
    }
  }
}