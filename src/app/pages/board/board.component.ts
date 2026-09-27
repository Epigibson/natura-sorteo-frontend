import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

interface BoardCard {
  folio: number;
  status: string;
  has_name: boolean;
}

interface BoardData {
  slug: string;
  title: string;
  prize: string;
  price_min: number;
  price_max: number;
  ticket_count: number;
  status: string;
  drawn: boolean;
  winner_folio: number | null;
  paid_count: number;
  free_count: number;
  cards: BoardCard[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="board-page">
      <!-- HEADER -->
      <header class="top">
        <div class="brand">🎟️ Sorteo Natura</div>
        @if (data(); as d) {
          <h1>{{ d.title }}</h1>
          <p class="sub">🎁 {{ d.prize }}</p>
          <div class="mini-stats">
            <span class="ms">{{ d.free_count }} disponibles</span>
            <span class="ms ms-taken">{{ d.ticket_count - d.free_count }} tomados</span>
            <span class="ms ms-paid">{{ d.paid_count }} pagados</span>
          </div>
        }
      </header>

      <!-- BANNER GANADOR -->
      @if (data()?.drawn) {
        <div class="winner-banner">
          <div class="wb-icon">🏆</div>
          <div>
            <div class="wb-title">¡Sorteo realizado!</div>
            <div class="wb-text">
              Ganó el folio <strong>{{ data()?.winner_folio }}</strong>
            </div>
          </div>
        </div>
      }

      <!-- LEYENDA -->
      <div class="legend">
        <div class="leg-item">
          <span class="dot dot-free"></span> Disponible
        </div>
        <div class="leg-item">
          <span class="dot dot-taken"></span> Tomado
        </div>
        <div class="leg-item">
          <span class="dot dot-paid"></span> Pagado
        </div>
        <div class="leg-item">
          <span class="dot dot-winner"></span> Ganador
        </div>
      </div>

      <!-- TABLERO -->
      @if (loading()) {
        <div class="loading">Cargando boletos…</div>
      } @else {
        <div class="grid">
          @for (card of cards(); track card.folio) {
            <button
              class="tile"
              [class.tile-free]="card.status === 'free'"
              [class.tile-taken]="card.status !== 'free' && card.status !== 'paid'"
              [class.tile-paid]="card.status === 'paid'"
              [class.tile-winner]="data()?.winner_folio === card.folio && data()?.drawn"
              (click)="selectCard(card)"
            >
              <div class="tile-folio">{{ pad(card.folio) }}</div>
              <div class="tile-status">{{ statusLabel(card) }}</div>
              @if (card.status === 'free') {
                <div class="tile-action">Toca para raspar</div>
              }
            </button>
          }
        </div>
      }

      <!-- MODAL: elegir código -->
      @if (selected(); as sel) {
        <div class="overlay" (click)="selected.set(null)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="d-icon">🎟️</div>
            <h3>Folio {{ pad(sel.folio) }}</h3>
            <p class="msg">
              Este boleto cuesta entre <strong>\${{ data()?.price_min }}</strong> y
              <strong>\${{ data()?.price_max }}</strong>. Ingresa tu código para rasparlo.
            </p>
            <label>Código de acceso</label>
            <input
              [(ngModel)]="code"
              placeholder="A7K2"
              (keyup.enter)="goToScratch()"
              autocomplete="off"
            />
            <div class="actions">
              <button class="btn-ghost" (click)="selected.set(null)">Cancelar</button>
              <button class="btn-solid" (click)="goToScratch()">Raspar 🎰</button>
            </div>
            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          </div>
        </div>
      }

      <!-- FOOTER -->
      <footer class="foot">
        Cada boleto se usa una sola vez · El precio lo descubres al raspar
      </footer>
    </div>
  `,
  styles: [
    `
      .board-page {
        min-height: 100vh;
        background: linear-gradient(170deg, #0d3b12 0%, #1b5e20 40%, #2e7d32 100%);
        padding: 28px 16px 60px;
      }

      .top {
        text-align: center;
        color: #fff;
        margin-bottom: 24px;
      }
      .brand {
        font-size: 11px;
        letter-spacing: 4px;
        text-transform: uppercase;
        opacity: 0.8;
      }
      .top h1 {
        font-size: 26px;
        font-weight: 900;
        margin: 8px 0 4px;
      }
      .sub {
        font-size: 14px;
        opacity: 0.85;
        margin-bottom: 14px;
      }
      .mini-stats {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ms {
        background: rgba(255, 255, 255, 0.14);
        padding: 5px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .ms-taken {
        background: rgba(255, 152, 0, 0.3);
      }
      .ms-paid {
        background: rgba(76, 175, 80, 0.35);
      }

      .winner-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        background: linear-gradient(135deg, #fff8e1, #ffecb3);
        border: 2px solid #ffe082;
        border-radius: 16px;
        padding: 18px;
        max-width: 480px;
        margin: 0 auto 22px;
      }
      .wb-icon {
        font-size: 36px;
      }
      .wb-title {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #8d6e00;
        font-weight: 700;
      }
      .wb-text {
        font-size: 18px;
        font-weight: 800;
        color: #5d4037;
      }

      .legend {
        display: flex;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .leg-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.85);
        font-size: 12px;
        font-weight: 600;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 4px;
      }
      .dot-free {
        background: #81c784;
      }
      .dot-taken {
        background: #ffb74d;
      }
      .dot-paid {
        background: #43a047;
      }
      .dot-winner {
        background: #ffd54f;
      }

      .loading {
        text-align: center;
        padding: 60px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 15px;
      }

      /* GRID DE TARJETAS */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
        gap: 12px;
        max-width: 680px;
        margin: 0 auto;
      }
      .tile {
        aspect-ratio: 1;
        border: none;
        border-radius: 16px;
        padding: 12px 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition:
          transform 0.15s,
          box-shadow 0.15s;
        position: relative;
        overflow: hidden;
      }
      .tile:hover {
        transform: translateY(-3px);
      }
      .tile:active {
        transform: scale(0.96);
      }

      .tile-free {
        background: linear-gradient(145deg, #e8f5e9, #c8e6c9);
        box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
      }
      .tile-free .tile-folio {
        color: #1b5e20;
      }
      .tile-free .tile-status {
        color: #2e7d32;
      }

      .tile-taken {
        background: linear-gradient(145deg, #fff3e0, #ffe0b2);
        box-shadow: 0 3px 12px rgba(255, 152, 0, 0.2);
        opacity: 0.85;
      }
      .tile-taken .tile-folio {
        color: #e65100;
      }

      .tile-paid {
        background: linear-gradient(145deg, #c8e6c9, #a5d6a7);
        box-shadow: 0 3px 12px rgba(56, 142, 60, 0.25);
      }
      .tile-paid .tile-folio {
        color: #1b5e20;
      }

      .tile-winner {
        background: linear-gradient(145deg, #fff9c4, #ffe082);
        box-shadow: 0 4px 20px rgba(255, 193, 7, 0.5);
        border: 2px solid #f9a825;
      }
      .tile-winner .tile-folio {
        color: #e65100;
      }
      .tile-winner::after {
        content: '🏆';
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 16px;
      }

      .tile-folio {
        font-size: 26px;
        font-weight: 900;
        line-height: 1;
      }
      .tile-status {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
      }
      .tile-action {
        font-size: 9px;
        color: #1b5e20;
        font-weight: 700;
        opacity: 0.7;
        margin-top: 2px;
      }

      /* MODAL */
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9000;
        padding: 18px;
        animation: fadeIn 0.18s ease;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .dialog {
        background: #faf7f0;
        border-radius: 20px;
        padding: 28px 26px 24px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        animation: popIn 0.22s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(12px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .d-icon {
        font-size: 36px;
        text-align: center;
        margin-bottom: 8px;
      }
      .dialog h3 {
        text-align: center;
        margin: 0 0 8px;
        font-size: 20px;
        color: #1f2937;
      }
      .msg {
        text-align: center;
        color: #6b7280;
        font-size: 13.5px;
        line-height: 1.55;
        margin-bottom: 18px;
      }
      label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin-bottom: 6px;
      }
      input {
        width: 100%;
        padding: 13px 14px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        letter-spacing: 3px;
        outline: none;
        box-sizing: border-box;
      }
      input:focus {
        border-color: #4caf50;
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.16);
      }
      .actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .btn-ghost {
        flex: 1;
        padding: 13px;
        border-radius: 12px;
        border: 2px solid #d1d5db;
        background: transparent;
        color: #6b7280;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-solid {
        flex: 1;
        padding: 13px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .error {
        margin-top: 12px;
        padding: 10px;
        background: #ffebee;
        color: #c62828;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
      }

      .foot {
        text-align: center;
        color: rgba(255, 255, 255, 0.55);
        font-size: 12px;
        margin-top: 36px;
      }

      @media (max-width: 480px) {
        .top h1 {
          font-size: 21px;
        }
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
          gap: 9px;
        }
        .tile-folio {
          font-size: 21px;
        }
      }
    `,
  ],
})
export class BoardComponent implements OnInit {
  data = signal<BoardData | null>(null);
  cards = signal<BoardCard[]>([]);
  loading = signal(true);
  selected = signal<BoardCard | null>(null);
  code = '';
  error = signal('');
  slug = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.api.getBoard(this.slug).subscribe({
      next: (d: any) => {
        this.data.set(d);
        this.cards.set(d.cards);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Sorteo no encontrado', 'Verifica el enlace');
      },
    });
  }

  pad(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }

  statusLabel(c: BoardCard): string {
    if (this.data()?.drawn && this.data()?.winner_folio === c.folio) return 'Ganador';
    return (
      {
        free: 'Libre',
        delivered: 'Entregado',
        registered: 'Registrado',
        scratched: 'Raspado',
        paid: 'Pagado',
      }[c.status] || c.status
    );
  }

  selectCard(c: BoardCard) {
    if (this.data()?.drawn) {
      this.toast.info('Sorteo ya realizado', `El ganador fue el folio ${this.data()?.winner_folio}`);
      return;
    }
    if (c.status === 'paid') {
      this.toast.info('Boleto pagado', `El folio ${this.pad(c.folio)} ya está confirmado`);
      return;
    }
    if (c.status !== 'free') {
      this.toast.warning(
        'Boleto tomado',
        `El folio ${this.pad(c.folio)} ya lo tiene alguien. Elige otro.`,
      );
      return;
    }
    this.selected.set(c);
    this.code = '';
    this.error.set('');
  }

  goToScratch() {
    const sel = this.selected();
    if (!sel) return;
    const cod = (this.code || '').trim().toUpperCase();
    if (cod.length < 3) {
      this.error.set('Escribe tu código de acceso');
      return;
    }
    this.router.navigate(['/jugar', this.slug], {
      queryParams: { folio: sel.folio, cod },
    });
  }
}
