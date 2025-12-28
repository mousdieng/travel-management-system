import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

/**
 * HTTP Interceptor that automatically manages loading states for HTTP requests.
 * Shows global loading indicator during requests unless excluded.
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private excludedUrls: string[] = [
    '/health',
    '/ping',
    '/refresh'
  ];

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if this request should show loading indicator
    if (this.shouldShowLoading(request)) {
      const loadingKey = this.getLoadingKey(request);
      this.loadingService.setLoading(true, loadingKey);

      return next.handle(request).pipe(
        finalize(() => this.loadingService.setLoading(false, loadingKey))
      );
    }

    return next.handle(request);
  }

  /**
   * Determine if loading indicator should be shown for this request
   */
  private shouldShowLoading(request: HttpRequest<any>): boolean {
    // Don't show loading for excluded URLs
    if (this.excludedUrls.some(url => request.url.includes(url))) {
      return false;
    }

    // Don't show loading if request has custom header to disable it
    if (request.headers.has('X-Skip-Loading')) {
      return false;
    }

    return true;
  }

  /**
   * Generate loading key based on request
   */
  private getLoadingKey(request: HttpRequest<any>): string {
    // Use custom loading key if provided
    const customKey = request.headers.get('X-Loading-Key');
    if (customKey) {
      return customKey;
    }

    // Generate key based on method and URL
    const method = request.method.toLowerCase();
    const urlPath = this.extractUrlPath(request.url);

    return `${method}-${urlPath}`;
  }

  /**
   * Extract meaningful path from URL for loading key
   */
  private extractUrlPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\/api\//, '').replace(/\//g, '-');
    } catch {
      return 'request';
    }
  }
}