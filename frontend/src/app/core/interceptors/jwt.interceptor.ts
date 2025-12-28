import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Public URLs that don't require authentication
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  if (token && !isPublicUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
