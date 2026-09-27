import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard" class="back">← Dashboard</a>
      <h1>👥 Historial de participantes</h1>
      <p class="sub">Personas que han comprado boletos en tus sorteos</p>

      @if (loading()) {
        <div class="loading">Cargando…</div>
      } @else if (participants().length === 0) {
        <div class="empty">Aún no hay participantes registrados</div>
      } @else {
        <div class="stats-row">
          <div class="gs"><div class="gs-n">{{ participants().length }}</div><div class="gs-t">personas</div></div>
          <div class="gs"><div class="gs-n">{{ totalTickets() }}</div><div class="gs-t">boletos</div></div>
          <div class="gs"><div class="gs-n">\${{ totalSpent() }}</div><div class="gs-t">recaudado</div></div>
        </div>

        <div class="list">
          @for (p of participants(); track p.phone) {
            <div class="p-card">
              <div class="p-header">
                <div class="p-name">{{ p.name }}</div>
                <div class="p-phone">{{ p.phone }}</div>
              </div>
              <div class="p-meta">
                <span class="p-tag">{{ p.tickets_count }} boleto(s)</span>
                <span class="p-tag p-paid">\${{ p.total_spent }} pagado</span>
              </div>
              <div class="p-raffles">
                @for (r of p.raffles; track r.folio + r.raffle_id) {
                  <div class="p-r">
                    <span class="p-r-f">#{{ r.folio }}</span>
                    <span class="p-r-n">{{ r.raffle }}</span>
                    <span class="p-r-a">\${{ r.amount }}</span>
                    @if (r.is_winner) { <span class="p-r-w">🏆</span> }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 28px 20px 60px; }
    .back { color: #1b5e20; font-weight: 600; text-decoration: none; font-size: 14px; }
    h1 { margin: 12px 0 4px; font-size: 26px; color: #1f2937; }
    .sub { color: #6b7280; margin-bottom: 20px; }
    .loading, .empty { text-align: center; padding: 50px; color: #6b7280; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .gs { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 16px; text-align: center; }
    .gs-n { font-size: 24px; font-weight: 900; color: #1b5e20; }
    .gs-t { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 700; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .p-card { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 16px; padding: 18px; }
    .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .p-name { font-weight: 800; font-size: 16px; color: #1f2937; }
    .p-phone { color: #6b7280; font-size: 13px; }
    .p-meta { display: flex; gap: 8px; margin-bottom: 10px; }
    .p-tag { background: #f3f4f6; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #374151; }
    .p-paid { background: #e8f5e9; color: #1b5e20; }
    .p-raffles { display: flex; flex-direction: column; gap: 6px; }
    .p-r { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 6px 10px; background: #fafafa; border-radius: 8px; }
    .p-r-f { font-weight: 800; color: #1b5e20; min-width: 32px; }
    .p-r-n { flex: 1; color: #6b7280; }
    .p-r-a { font-weight: 700; color: #c9a227; }
    @media (max-width: 480px) {
      .page { padding: 16px 12px 40px; }
      .stats-row { grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .gs-n { font-size: 18px; }
      .p-header { flex-direction: column; align-items: flex-start; gap: 2px; }
    }
  `],
})
export class ParticipantsComponent implements OnInit {
  participants = signal<any[]>([]);
  loading = signal(true);

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getParticipants().subscribe({
      next: (d) => { this.participants.set(d.participants); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error', 'No se pudo cargar el historial'); },
    });
  }

  totalTickets(): number {
    return this.participants().reduce((a, p) => a + p.tickets_count, 0);
  }

  totalSpent(): number {
    return this.participants().reduce((a, p) => a + p.total_spent, 0);
  }
}
