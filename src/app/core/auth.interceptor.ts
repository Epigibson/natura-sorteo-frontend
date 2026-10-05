import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TokenOut } from './models';
import { AuthService } from './auth.service';

/** Renovación en curso: todas las peticiones que reciben 401 a la vez comparten UNA sola. */
let refreshing$: Observable<TokenOut> | null = null;

function refreshOnce(auth: AuthService): Observable<TokenOut> {
  if (!refreshing$) {
    refreshing$ = auth.refreshToken().pipe(
      tap((res) => auth.setTokens(res.access_token, res.refresh_token, res.role, res.name)),
      finalize(() => (refreshing$ = null)),
      shareReplay(1),
    );
  }
  return refreshing$;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const sentToken = localStorage.getItem('sn_token');
  const isApi = req.url.includes('/api/');
  const isAuthCall = req.url.includes('/auth/');

  if (sentToken && isApi && !isAuthCall) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${sentToken}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Solo un 401 de la API (no del login/refresh) justifica renovar la sesión
      if (err.status !== 401 || !isApi || isAuthCall) return throwError(() => err);

      if (!localStorage.getItem('sn_refresh')) {
        auth.logout();
        return throwError(() => err);
      }

      const retryWith = (token: string) =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));

      // Otra petición ya renovó el token mientras esta volaba: basta reintentar con el nuevo
      const current = localStorage.getItem('sn_token');
      if (current && current !== sentToken) return retryWith(current);

      return refreshOnce(auth).pipe(
        // Este catchError va ANTES del switchMap: solo cierra sesión si falla la RENOVACIÓN,
        // no si el reintento devuelve un error normal (400, 403, 500...).
        catchError((refreshErr: HttpErrorResponse) => {
          // Sin red / servidor dormido (status 0, 5xx): no es motivo para sacar al usuario
          if (refreshErr.status === 401 || refreshErr.status === 403) auth.logout();
          return throwError(() => (refreshErr.status === 401 || refreshErr.status === 403 ? refreshErr : err));
        }),
        switchMap((res) => retryWith(res.access_token)),
      );
    }),
  );
};
