import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ChangePasswordComponent } from '../../core/change-password.component';
import { Raffle } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ChangePasswordComponent],
  template: `
    <div class="page">
      <header class="top">
        <div class="top-id">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2M13 11v2M13 17v2"/>
              </svg>
            </span>
            <span class="brand-name">Sorteo Natura</span>
          </div>
          <h1>Sorteos</h1>
          <p class="subtitle">Gestiona tus sorteos, boletos y ganadores en un solo lugar</p>
        </div>

        <div class="top-actions">
          <span class="user">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="user-name">Hola, {{ auth.user()?.name || 'Yuri' }}</span>
          </span>

          <button class="icon-btn" (click)="pwd.show()" title="Cambiar contraseña" aria-label="Cambiar contraseña">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>

          <button class="btn-ghost" (click)="auth.logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Salir</span>
          </button>

          @if (auth.user()?.role === 'admin') {
            <a routerLink="/participantes" class="icon-btn" title="Participantes" aria-label="Participantes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </a>
          }

          @if (auth.user()?.role === 'admin') {
            <a routerLink="/configuracion" class="icon-btn" title="Configuración" aria-label="Configuración">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>
          }

          @if (auth.user()?.role === 'admin') {
            <a routerLink="/sorteos/nuevo" class="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Nuevo sorteo</span>
            </a>
          }
        </div>
      </header>

      <app-change-password #pwd />

      @if (!loading() && raffles().length > 0) {
        <section class="stats" aria-label="Resumen global">
          <div class="stat stat-hero">
            <span class="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </span>
            <div class="stat-value">{{ raffles().length }}</div>
            <div class="stat-label">Sorteos</div>
          </div>

          <div class="stat stat--tickets">
            <span class="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2M13 11v2M13 17v2"/>
              </svg>
            </span>
            <div class="stat-value">{{ totalTickets() }}</div>
            <div class="stat-label">Boletos totales</div>
          </div>

          <div class="stat stat--open">
            <span class="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            </span>
            <div class="stat-value">{{ openCount() }}</div>
            <div class="stat-label">Abiertos</div>
          </div>

          <div class="stat stat--drawn">
            <span class="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/>
                <path d="M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </span>
            <div class="stat-value">{{ drawnCount() }}</div>
            <div class="stat-label">Sorteados</div>
          </div>
        </section>
      }

      @if (loading()) {
        <p class="sr-only">Cargando sorteos…</p>
        <section class="stats" aria-hidden="true">
          <div class="stat sk"></div>
          <div class="stat sk"></div>
          <div class="stat sk"></div>
          <div class="stat sk"></div>
        </section>
        <div class="grid" aria-hidden="true">
          <div class="card sk sk-card"></div>
          <div class="card sk sk-card"></div>
          <div class="card sk sk-card"></div>
        </div>
      } @else if (raffles().length === 0) {
        <div class="empty">
          <div class="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2M13 11v2M13 17v2"/>
            </svg>
          </div>
          <h2>Aún no hay sorteos</h2>
          <p>Crea tu primer sorteo y genera los boletos automáticamente.</p>
          <a routerLink="/sorteos/nuevo" class="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Crear sorteo</span>
          </a>
        </div>
      } @else {
        <div class="grid">
          @for (r of raffles(); track r.id) {
            <a class="card" [routerLink]="['/sorteos', r.id]" [attr.data-status]="r.status">
              <div class="card-top">
                <span class="badge" [class]="'badge-' + r.status">
                  <span class="dot" aria-hidden="true"></span>
                  {{ statusLabel(r.status) }}
                </span>
                <span class="date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {{ r.created_at | date: 'dd/MM/yyyy' }}
                </span>
              </div>
              <h3>{{ r.title }}</h3>
              <p class="prize">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="8" width="18" height="4" rx="1"/>
                  <path d="M12 8v13"/>
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 5.5 12 8c0-2.5 2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>
                </svg>
                <span>{{ r.prize }}</span>
              </p>
              <div class="meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    <path d="M13 5v2M13 11v2M13 17v2"/>
                  </svg>
                  {{ r.ticket_count }} boletos
                </span>
                <span class="price">\${{ r.price_min }}–\${{ r.price_max }}</span>
              </div>
              @if (r.status === 'drawn' && r.winner) {
                <div class="winner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/>
                    <path d="M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                  Folio {{ r.winner.folio }} — {{ r.winner.participant?.name || 'Ganador' }}
                </div>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 32px 24px 72px;
      }

      /* ---------- Header ---------- */
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 12px;
      }
      .brand-mark {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: linear-gradient(140deg, var(--brand-700, #1b5e20), var(--brand-500, #2e7d32));
        color: #fff;
        box-shadow: 0 6px 14px rgba(27, 94, 32, 0.3);
      }
      .brand-mark svg {
        width: 15px;
        height: 15px;
      }
      .brand-name {
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 800;
        color: var(--brand-700, #1b5e20);
      }
      h1 {
        margin: 0;
        font-size: clamp(26px, 4vw, 34px);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.12;
        color: var(--ink, #14231b);
      }
      .subtitle {
        margin: 8px 0 0;
        font-size: 14.5px;
        color: var(--muted, #5b6b62);
      }

      .top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .user {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-right: 4px;
      }
      .avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: linear-gradient(140deg, var(--brand-100, #e0eee2), var(--brand-200, #c2ddc7));
        border: 1px solid var(--brand-200, #c2ddc7);
        color: var(--brand-800, #164c1c);
        font-size: 13px;
        font-weight: 800;
      }
      .user-name {
        color: var(--muted, #5b6b62);
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
      }

      /* ---------- Buttons ---------- */
      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 18px;
        background: linear-gradient(135deg, var(--brand-700, #1b5e20), var(--brand-500, #2e7d32));
        color: #fff;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        box-shadow: 0 10px 22px rgba(27, 94, 32, 0.28);
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 28px rgba(27, 94, 32, 0.34);
        filter: brightness(1.06);
      }
      .btn-primary:active {
        transform: translateY(0);
      }
      .btn-primary svg {
        width: 16px;
        height: 16px;
      }

      .btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 15px;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #e2e8e4);
        border-radius: 12px;
        color: var(--ink-soft, #2f4038);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }
      .btn-ghost:hover {
        background: var(--brand-50, #eef6ef);
        border-color: var(--brand-200, #c2ddc7);
        color: var(--brand-700, #1b5e20);
      }
      .btn-ghost svg {
        width: 16px;
        height: 16px;
      }

      .icon-btn {
        width: 44px;
        height: 44px;
        display: inline-grid;
        place-items: center;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #e2e8e4);
        border-radius: 12px;
        color: var(--ink-soft, #2f4038);
        cursor: pointer;
        text-decoration: none;
        transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }
      .icon-btn:hover {
        background: var(--brand-50, #eef6ef);
        border-color: var(--brand-200, #c2ddc7);
        color: var(--brand-700, #1b5e20);
      }
      .icon-btn svg {
        width: 18px;
        height: 18px;
      }

      .btn-primary:focus-visible,
      .btn-ghost:focus-visible,
      .icon-btn:focus-visible,
      .card:focus-visible {
        outline: 2px solid var(--brand-500, #2e7d32);
        outline-offset: 2px;
      }

      /* ---------- Stats ---------- */
      .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 26px;
      }
      .stat {
        position: relative;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #e2e8e4);
        border-radius: 16px;
        padding: 18px;
        overflow: hidden;
        animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both;
      }
      .stat::after {
        content: '';
        position: absolute;
        left: 18px;
        right: 18px;
        top: 0;
        height: 2px;
        border-radius: 0 0 4px 4px;
        background: var(--tone, var(--brand-500, #2e7d32));
        opacity: 0.45;
      }
      .stat-icon {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        background: var(--tone-soft, var(--brand-100, #e0eee2));
        color: var(--tone, var(--brand-700, #1b5e20));
        margin-bottom: 14px;
      }
      .stat-icon svg {
        width: 18px;
        height: 18px;
      }
      .stat-value {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1;
        color: var(--ink, #14231b);
        font-variant-numeric: tabular-nums;
      }
      .stat-label {
        margin-top: 7px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted, #5b6b62);
      }

      .stat-hero {
        background: linear-gradient(150deg, var(--brand-900, #0d3b26), var(--brand-700, #1b5e20) 58%, var(--brand-500, #2e7d32));
        border-color: transparent;
        box-shadow: 0 16px 34px rgba(13, 59, 38, 0.28);
      }
      .stat-hero .stat-value {
        color: #fff;
      }
      .stat-hero .stat-label {
        color: rgba(255, 255, 255, 0.75);
      }
      .stat-hero .stat-icon {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }
      .stat-hero::after {
        background: rgba(255, 255, 255, 0.5);
      }

      .stat--tickets {
        --tone: #1d4ed8;
        --tone-soft: #e6edfd;
      }
      .stat--open {
        --tone: #0f766e;
        --tone-soft: #dcf1ee;
      }
      .stat--drawn {
        --tone: #b45309;
        --tone-soft: #fbf0da;
      }

      /* ---------- Cards ---------- */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #e2e8e4);
        border-radius: 18px;
        padding: 20px 20px 20px 24px;
        text-decoration: none;
        color: inherit;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(20, 35, 27, 0.04), 0 8px 20px rgba(20, 35, 27, 0.05);
        transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.22s ease,
          border-color 0.22s ease;
        animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both;
      }
      .card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 16px;
        bottom: 16px;
        width: 3px;
        border-radius: 0 4px 4px 0;
        background: var(--status-tone, var(--brand-500, #2e7d32));
      }
      .card[data-status='open'] {
        --status-tone: #2e7d32;
      }
      .card[data-status='closed'] {
        --status-tone: #ed6c02;
      }
      .card[data-status='drawn'] {
        --status-tone: #1565c0;
      }
      .card[data-status='drawing'] {
        --status-tone: #8b5cf6;
      }
      .card[data-status='draft'] {
        --status-tone: #9ca3af;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: var(--brand-200, #c2ddc7);
        box-shadow: 0 16px 34px rgba(20, 35, 27, 0.12);
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
        padding: 5px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
      }
      .badge .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .badge-open {
        background: var(--brand-100, #e0eee2);
        color: var(--brand-800, #164c1c);
      }
      .badge-closed {
        background: #fdeee0;
        color: #a64200;
      }
      .badge-drawn {
        background: #e2edfa;
        color: #124a8f;
      }
      .badge-drawing {
        background: #eee8fd;
        color: #5b2eb8;
      }
      .badge-draft {
        background: #eef0ef;
        color: #55655c;
      }

      .date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted, #5b6b62);
        white-space: nowrap;
      }
      .date svg {
        width: 13px;
        height: 13px;
        opacity: 0.75;
      }

      .card h3 {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.01em;
        line-height: 1.3;
        color: var(--ink, #14231b);
        overflow-wrap: anywhere;
      }
      .prize {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0 0 16px;
        color: var(--muted, #5b6b62);
        font-size: 14px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .prize svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        margin-top: 2px;
        opacity: 0.7;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid var(--line-soft, #edf1ee);
        font-size: 13px;
      }
      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--muted, #5b6b62);
        font-weight: 600;
      }
      .meta-item svg {
        width: 14px;
        height: 14px;
        opacity: 0.7;
      }
      .price {
        font-weight: 800;
        color: var(--brand-700, #1b5e20);
        font-variant-numeric: tabular-nums;
      }

      .winner {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 11px 12px;
        background: linear-gradient(120deg, var(--gold-soft, #fbf3df), #f6e7c3);
        border: 1px solid #ead9a8;
        border-radius: 12px;
        color: var(--gold-ink, #8a6712);
        font-size: 13px;
        font-weight: 700;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .winner svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
      }

      /* ---------- Loading / empty ---------- */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .sk {
        pointer-events: none;
        background: linear-gradient(100deg, #e9eeea 30%, #f5f8f5 50%, #e9eeea 70%);
        background-size: 200% 100%;
        animation: shimmer 1.3s linear infinite;
        border-color: transparent;
      }
      .stat.sk {
        height: 118px;
      }
      .sk-card {
        height: 190px;
      }
      .sk::after,
      .sk-card::before {
        display: none;
      }

      .empty {
        text-align: center;
        padding: 64px 24px;
        background: var(--surface, #fff);
        border: 1.5px dashed var(--line, #e2e8e4);
        border-radius: 20px;
      }
      .empty-icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 18px;
        display: grid;
        place-items: center;
        border-radius: 22px;
        background: var(--brand-50, #eef6ef);
        color: var(--brand-700, #1b5e20);
      }
      .empty-icon svg {
        width: 32px;
        height: 32px;
      }
      .empty h2 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 800;
        color: var(--ink, #14231b);
      }
      .empty p {
        color: var(--muted, #5b6b62);
        margin: 0 auto 22px;
        max-width: 380px;
        line-height: 1.55;
      }

      /* ---------- Motion ---------- */
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @keyframes shimmer {
        from {
          background-position: 200% 0;
        }
        to {
          background-position: -200% 0;
        }
      }
      .stat:nth-child(2) {
        animation-delay: 0.05s;
      }
      .stat:nth-child(3) {
        animation-delay: 0.1s;
      }
      .stat:nth-child(4) {
        animation-delay: 0.15s;
      }
      .card:nth-child(2) {
        animation-delay: 0.05s;
      }
      .card:nth-child(3) {
        animation-delay: 0.1s;
      }
      .card:nth-child(4) {
        animation-delay: 0.15s;
      }
      .card:nth-child(5) {
        animation-delay: 0.2s;
      }
      .card:nth-child(6) {
        animation-delay: 0.25s;
      }
      .card:nth-child(7) {
        animation-delay: 0.3s;
      }
      .card:nth-child(8) {
        animation-delay: 0.35s;
      }

      /* ---------- Responsive ---------- */
      @media (max-width: 900px) {
        .stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 640px) {
        .page {
          padding: 20px 14px 56px;
        }
        .top {
          flex-direction: column;
          align-items: stretch;
          gap: 18px;
        }
        .top-actions {
          justify-content: flex-start;
        }
        .user {
          width: 100%;
          margin: 0 0 2px;
        }
        .btn-primary {
          flex: 1;
        }
        .subtitle {
          font-size: 13.5px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .card {
          padding: 18px 16px 18px 20px;
        }
      }
      @media (max-width: 400px) {
        .stats {
          gap: 10px;
        }
        .stat {
          padding: 14px;
        }
        .stat-value {
          font-size: 24px;
        }
        .stat-icon {
          width: 34px;
          height: 34px;
          margin-bottom: 10px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .stat,
        .card {
          animation: none;
        }
        .btn-primary,
        .btn-ghost,
        .icon-btn,
        .card {
          transition: none;
        }
        .btn-primary:hover,
        .card:hover {
          transform: none;
        }
        .sk {
          animation: none;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  raffles = signal<Raffle[]>([]);
  loading = signal(true);

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.api.listRaffles().subscribe({
      next: (list) => {
        this.raffles.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.auth.isLoggedIn) this.router.navigate(['/login']);
      },
    });
  }

  totalTickets(): number {
    return this.raffles().reduce((a, r) => a + r.ticket_count, 0);
  }
  openCount(): number {
    return this.raffles().filter((r) => r.status === 'open').length;
  }
  drawnCount(): number {
    return this.raffles().filter((r) => r.status === 'drawn').length;
  }

  initials(): string {
    const name = (this.auth.user()?.name || 'Yuri').trim();
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'U';
  }

  statusLabel(s: string) {
    return (
      {
        open: 'Abierto',
        closed: 'Cerrado',
        drawing: 'Sorteando',
        drawn: 'Sorteado',
        draft: 'Borrador',
      }[s] || s
    );
  }
}
