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
        <div>
          <div class="brand">🎟️ Sorteo Natura</div>
          <h1>Sorteos</h1>
        </div>
        <div class="top-actions">
          <span class="user">Hola, {{ auth.user()?.name || 'Yuri' }}</span>
          <button class="btn-ghost" (click)="pwd.show()" title="Cambiar contraseña">🔒</button>
          <button class="btn-ghost" (click)="auth.logout()">Salir</button>
          <a routerLink="/sorteos/nuevo" class="btn-primary">+ Nuevo sorteo</a>
        </div>
      </header>

      <app-change-password #pwd />

      @if (loading()) {
        <div class="loading">Cargando sorteos…</div>
      } @else if (raffles().length === 0) {
        <div class="empty">
          <div class="empty-icon">🎲</div>
          <h2>Aún no hay sorteos</h2>
          <p>Crea tu primer sorteo y genera los boletos automáticamente.</p>
          <a routerLink="/sorteos/nuevo" class="btn-primary">Crear sorteo</a>
        </div>
      } @else {
        <div class="grid">
          @for (r of raffles(); track r.id) {
            <a class="card" [routerLink]="['/sorteos', r.id]">
              <div class="card-top">
                <span class="badge" [class]="'badge-' + r.status">{{ statusLabel(r.status) }}</span>
                <span class="date">{{ r.created_at | date: 'dd/MM/yyyy' }}</span>
              </div>
              <h3>{{ r.title }}</h3>
              <p class="prize">🎁 {{ r.prize }}</p>
              <div class="meta">
                <span>{{ r.ticket_count }} boletos</span>
                <span>\${{ r.price_min }}–\${{ r.price_max }}</span>
              </div>
              @if (r.status === 'drawn' && r.winner) {
                <div class="winner">
                  🏆 Folio {{ r.winner.folio }} — {{ r.winner.participant?.name || 'Ganador' }}
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
        max-width: 1100px;
        margin: 0 auto;
        padding: 28px 20px 60px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }
      .brand {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #1b5e20;
        font-weight: 700;
      }
      h1 {
        margin: 4px 0 0;
        font-size: 28px;
        color: #1f2937;
      }
      .top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .user {
        color: #6b7280;
        font-size: 14px;
      }
      .btn-primary {
        display: inline-block;
        padding: 11px 18px;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
      }
      .btn-ghost {
        padding: 11px 14px;
        background: transparent;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        color: #6b7280;
        font-weight: 600;
        cursor: pointer;
      }
      .loading {
        text-align: center;
        padding: 60px;
        color: #6b7280;
      }
      .empty {
        text-align: center;
        padding: 60px 20px;
        background: #fff;
        border-radius: 20px;
        border: 2px dashed #e5e7eb;
      }
      .empty-icon {
        font-size: 48px;
      }
      .empty h2 {
        margin: 12px 0 6px;
        color: #1f2937;
      }
      .empty p {
        color: #6b7280;
        margin-bottom: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .card {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 18px;
        padding: 20px;
        text-decoration: none;
        color: inherit;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
      }
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .badge {
        font-size: 11px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .badge-open {
        background: #e8f5e9;
        color: #1b5e20;
      }
      .badge-closed {
        background: #fff3e0;
        color: #e65100;
      }
      .badge-drawn {
        background: #e3f2fd;
        color: #1565c0;
      }
      .badge-draft {
        background: #f3f4f6;
        color: #6b7280;
      }
      .date {
        font-size: 12px;
        color: #9ca3af;
      }
      .card h3 {
        margin: 0 0 6px;
        font-size: 18px;
        color: #1f2937;
      }
      .prize {
        color: #6b7280;
        font-size: 14px;
        margin: 0 0 14px;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #1b5e20;
        font-weight: 700;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }
      .winner {
        margin-top: 12px;
        padding: 10px;
        background: #fff8e1;
        border-radius: 10px;
        color: #8d6e00;
        font-size: 13px;
        font-weight: 700;
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

  statusLabel(s: string) {
    return (
      { open: 'Abierto', closed: 'Cerrado', drawn: 'Sorteado', draft: 'Borrador' }[s] || s
    );
  }
}
