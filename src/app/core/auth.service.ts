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
    return this.http.post<TokenOut>(`${API}/auth/login`, { phone, password }).pipe(
      tap((res) => {
        localStorage.setItem('sn_token', res.access_token);
        localStorage.setItem('sn_refresh', res.refresh_token);
        localStorage.setItem('sn_role', res.role);
        localStorage.setItem('sn_name', res.name);
        this.token.set(res.access_token);
        this.user.set({ sub: '', role: res.role, name: res.name });
      }),
    );
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
