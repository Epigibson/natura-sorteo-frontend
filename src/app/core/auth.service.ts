import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { TokenOut, User } from './models';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const t = localStorage.getItem('sn_token');
    const r = localStorage.getItem('sn_role');
    const n = localStorage.getItem('sn_name');
    if (t && r) {
      this.token.set(t);
      this.user.set({ sub: '', role: r, name: n || '' });
    }
  }

  login(phone: string, password: string) {
    return this.http
      .post<TokenOut>(`${API}/auth/login`, { phone, password })
      .pipe(tap((res) => this.setTokens(res.access_token, res.refresh_token, res.role, res.name)));
  }

  /**
   * Guarda una sesión nueva (login, refresh o cambio de contraseña) y mantiene sincronizados
   * localStorage y las señales. Si llegan rol/nombre (login y refresh) también se actualizan,
   * así un cambio de rol en el servidor se refleja sin volver a iniciar sesión.
   */
  setTokens(access: string, refresh: string, role?: string, name?: string) {
    localStorage.setItem('sn_token', access);
    localStorage.setItem('sn_refresh', refresh);
    this.token.set(access);
    if (role !== undefined) {
      localStorage.setItem('sn_role', role);
      localStorage.setItem('sn_name', name ?? '');
      this.user.set({ sub: '', role, name: name ?? '' });
    }
  }

  refreshToken() {
    const refresh = localStorage.getItem('sn_refresh') || '';
    return this.http.post<TokenOut>(`${API}/auth/refresh`, { refresh_token: refresh });
  }

  logout() {
    localStorage.removeItem('sn_token');
    localStorage.removeItem('sn_refresh');
    localStorage.removeItem('sn_role');
    localStorage.removeItem('sn_name');
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  get isLoggedIn() {
    return !!this.token();
  }
}
