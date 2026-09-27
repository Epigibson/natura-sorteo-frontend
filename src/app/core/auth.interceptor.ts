import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = localStorage.getItem('sn_token');

  if (token && req.url.includes('/api/') && !req.url.includes('/auth/')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.includes('/api/') && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        const refresh = localStorage.getItem('sn_refresh');
        if (refresh && !isRefreshing) {
          isRefreshing = true;
          return auth.refreshToken().pipe(
            switchMap((res) => {
              isRefreshing = false;
              localStorage.setItem('sn_token', res.access_token);
              localStorage.setItem('sn_refresh', res.refresh_token);
              const retry = req.clone({ setHeaders: { Authorization: `Bearer ${res.access_token}` } });
              return next(retry);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              auth.logout();
              return throwError(() => refreshErr);
            }),
          );
        } else if (isRefreshing) {
          // Mientras refresca, devolver error normal
          return throwError(() => err);
        } else {
          auth.logout();
          return throwError(() => err);
        }
      }
      return throwError(() => err);
    }),
  );
};
