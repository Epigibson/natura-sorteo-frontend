import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ScratchCardComponent } from '../../core/scratch-card.component';
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
  imports: [CommonModule, FormsModule, ScratchCardComponent],
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

      @if (scratchMode()) {
        <!-- PANTALLA RASPABR TODOS -->
        <div class="scratch-screen">
          <div class="ss-header">
            <h2>👆 Raspa tus boletos</h2>
            <p>Desliza el dedo sobre cada boleto para descubrir tu precio</p>
          </div>
          <div class="ss-cards">
            @for (folio of getClaimedFoliosArray(); track folio) {
              <div class="ss-card-wrap">
                <app-scratch-card
                  [amount]="amountMap[folio] || 0"
                  (revealed)="onTicketScratched({ folio: folio, amount: amountMap[folio] || 0 })"
                />
                <div class="ss-folio-label">Folio {{ pad(folio) }}</div>
              </div>
            }
          </div>

          @if (allScratched()) {
            <div class="ss-results">
              <h3>🎉 ¡Tus boletos!</h3>
              @for (r of scratchedResults(); track r.folio) {
                <div class="ss-result-row">
                  <span class="ss-r-folio">Folio {{ pad(r.folio) }}</span>
                  <span class="ss-r-amount">\${{ r.amount }}</span>
                </div>
              }
              <div class="ss-total">Total: <strong>\${{ getTotal() }}</strong></div>
              <button class="btn-wa-big" (click)="sendAllWhatsApp()">📲 Enviar a la organizadora por WhatsApp</button>
            </div>
          }

          @if (scratchedResults().length === 0) {
              <button class="btn-back" (click)="exitScratchMode()">← Volver al tablero</button>
            }
        </div>
      } @else {
        <!-- BOTÓN RASPABR BOLETOS -->
        @if (claimedFolios.size > 0 && scratchedResults().length === 0 && !loading()) {
          <div class="scratch-cta">
            <div class="sc-info">Tienes <strong>{{ claimedFolios.size }}</strong> boleto(s) listo(s) para raspar</div>
            <button class="btn-scratch-all" (click)="goScratchMode()">👆 Raspar {{ claimedFolios.size > 1 ? 'mis boletos' : 'mi boleto' }}</button>
          </div>
        }

        <!-- LEYENDA -->
        <div class="legend">
          <div class="leg-item"><span class="dot dot-free"></span> Disponible</div>
          <div class="leg-item"><span class="dot dot-mine"></span> Mío</div>
          <div class="leg-item"><span class="dot dot-taken"></span> Tomado</div>
          <div class="leg-item"><span class="dot dot-paid"></span> Pagado</div>
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
                [class.tile-mine]="claimedFolios.has(card.folio)"
                [class.tile-winner]="data()?.winner_folio === card.folio && data()?.drawn"
                (click)="toggleCard(card)"
              >
                <div class="tile-folio">{{ pad(card.folio) }}</div>
                <div class="tile-status">{{ statusLabel(card) }}</div>
                @if (claimedFolios.has(card.folio)) {
                  @if (isScratched(card.folio)) {
                    <div class="tile-action">🎰 Raspado</div>
                  } @else {
                    <div class="tile-action">✅ Tuyo</div>
                  }
                } @else if (card.status === 'free') {
                  <div class="tile-action">Toca para elegir</div>
                }
              </button>
            }
          </div>
        }
      }

      <!-- MODAL: registro antes de asignar -->
      @if (selected(); as sel) {
        <div class="overlay" (click)="selected.set(null)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="d-icon">🎟️</div>
            <h3>Folio {{ pad(sel.folio) }}</h3>
            <p class="msg">
              Este boleto cuesta entre <strong>\${{ data()?.price_min }}</strong> y
              <strong>\${{ data()?.price_max }}</strong>. Regístrate para asegurarlo y poder rasparlo.
            </p>
            <label>Nombre completo</label>
            <input [(ngModel)]="regName" placeholder="Ana García López" autocomplete="name" />
            <label>Número de WhatsApp / celular</label>
            <input [(ngModel)]="regPhone" placeholder="55 1234 5678" type="tel" maxlength="15" />
            <p class="msg" style="font-size:11px; margin-top:8px; margin-bottom:0;">
              Reclama todos tus boletos primero, luego raspa.
            </p>
            <div class="actions">
              <button class="btn-ghost" (click)="selected.set(null)">Cancelar</button>
              <button class="btn-solid" (click)="claimTicket()" [disabled]="claiming()">
                {{ claiming() ? 'Asignando…' : 'Quiero este 🎰' }}
              </button>
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
      background: rgba(255,215,0,0.1);
      border: 1px solid rgba(255,215,0,0.25);
      border-radius: 20px;
      padding: 22px;
      max-width: 480px;
      margin: 0 auto 24px;
      backdrop-filter: blur(16px);
      position: relative;
      z-index: 2;
    }
    .wb-icon { font-size: 36px; }
    .wb-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #f0c94e;
      font-weight: 800;
    }
    .wb-text {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
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
      .dot-mine { background: #42a5f5; }
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
      max-width: 700px;
      margin: 0 auto;
      position: relative;
      z-index: 2;
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

      .tile-mine {
        background: linear-gradient(145deg, #e3f2fd, #90caf9);
        box-shadow: 0 4px 16px rgba(33,150,243,0.35);
        border: 2px solid #42a5f5;
      }
      .tile-mine .tile-folio { color: #0d47a1; }
      .tile-deselect {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(198,40,40,0.85);
        color: #fff;
        font-size: 14px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        line-height: 1;
      }
      .tile-deselect:hover {
        background: #c62828;
        transform: scale(1.15);
      }
      .tile-mine .tile-action { color: #1565c0; font-weight: 800; }
      .tile-winner {
      background: rgba(255,215,0,0.15);
      border-color: rgba(255,215,0,0.4);
      box-shadow: 0 8px 32px rgba(255,215,0,0.2);
    }
    .tile-winner .tile-folio { color: #ffd54f; }
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

      .scratch-cta {
      background: rgba(33,150,243,0.1);
      border: 1px solid rgba(33,150,243,0.25);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
      backdrop-filter: blur(16px);
      position: relative;
      z-index: 2;
    }
    .sc-info {
      color: rgba(255,255,255,0.7);
      font-size: 15px;
      margin-bottom: 16px;
    }
    .sc-info strong {
      color: #64b5f6;
    }
    .btn-scratch-all {
      padding: 16px 40px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 8px 28px rgba(21,101,192,0.35);
      transition: all 0.25s;
      font-family: inherit;
    }
    .btn-scratch-all:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 36px rgba(21,101,192,0.45);
    }

      .scratch-screen {
      max-width: 600px;
      margin: 0 auto;
      position: relative;
      z-index: 2;
    }
    .ss-header {
      text-align: center;
      color: #fff;
      margin-bottom: 28px;
    }
    .ss-header h2 {
      font-size: 26px;
      margin: 0 0 8px;
      font-weight: 900;
    }
    .ss-header p {
      color: rgba(255,255,255,0.5);
      font-size: 14px;
    }
      .ss-cards {
        display: flex;
        flex-direction: column;
        gap: 24px;
        align-items: center;
      }
      .ss-card-wrap {
        text-align: center;
      }
      .ss-folio-label {
        color: rgba(255,255,255,0.8);
        font-size: 13px;
        font-weight: 700;
        margin-top: 6px;
      }
      .ss-results {
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        padding: 24px;
        margin-top: 28px;
        color: #fff;
      }
      .ss-results h3 {
        text-align: center;
        margin: 0 0 16px;
        font-size: 20px;
      }
      .ss-result-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 14px;
        background: rgba(255,255,255,0.08);
        border-radius: 10px;
        margin-bottom: 8px;
      }
      .ss-r-folio { font-weight: 700; }
      .ss-r-amount { font-weight: 900; color: #ffe082; }
      .ss-total {
        text-align: right;
        font-size: 18px;
        padding: 12px 14px;
        color: #ffe082;
      }
      .btn-wa-big {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #128c4a, #25d366);
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 20px;
      box-shadow: 0 8px 28px rgba(37,211,102,0.3);
      transition: all 0.25s;
      font-family: inherit;
    }
    .btn-wa-big:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 36px rgba(37,211,102,0.4);
    }
      .btn-back {
        display: block;
        width: 100%;
        margin-top: 16px;
        padding: 12px;
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        background: transparent;
        color: rgba(255,255,255,0.7);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }

      .foot {
      text-align: center;
      color: rgba(255,255,255,0.3);
      font-size: 12px;
      margin-top: 40px;
      position: relative;
      z-index: 2;
    }

      @media (max-width: 480px) {
        .board-page { padding: 16px 10px 40px; }
        .top h1 { font-size: 19px; }
        .sub { font-size: 12px; }
        .mini-stats { gap: 6px; }
        .ms { font-size: 10px; padding: 4px 10px; }
        .legend { gap: 10px; }
        .leg-item { font-size: 11px; }
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
          gap: 8px;
        }
        .tile { border-radius: 12px; padding: 8px 4px; }
        .tile-folio { font-size: 18px; }
        .tile-status { font-size: 8px; }
        .tile-action { font-size: 7px; }
        .dialog { padding: 22px 16px 18px; }
        .d-icon { font-size: 28px; }
        .dialog h3 { font-size: 17px; }
      }
    `,
  ],
})
export class BoardComponent implements OnInit {
  data = signal<BoardData | null>(null);
  cards = signal<BoardCard[]>([]);
  loading = signal(true);
  selected = signal<BoardCard | null>(null);
  regName = '';
  regPhone = '';
  claimedFolios = new Set<number>();
  claimedCodes: Record<number, string> = {};
  scratchMode = signal(false);

  saveClaimedState() {
    localStorage.setItem('sn_claimed', JSON.stringify({
      folios: Array.from(this.claimedFolios),
      codes: this.claimedCodes,
      scratched: this.scratchedResults(),
    }));
  }

  loadClaimedState() {
    try {
      const raw = localStorage.getItem('sn_claimed');
      if (raw) {
        const d = JSON.parse(raw);
        this.claimedFolios = new Set(d.folios || []);
        this.claimedCodes = d.codes || {};
        this.scratchedResults.set(d.scratched || []);
        // Si ya raspó al menos uno, marcar allScratched
        if ((d.scratched || []).length > 0 && (d.scratched || []).length >= (d.folios || []).length) {
          this.allScratched.set(true);
        }
      }
    } catch {}
  }
  scratchedResults = signal<{ folio: number; amount: number }[]>([]);
  amountMap: Record<number, number> = {};
  allScratched = signal(false);
  claiming = signal(false);
  error = signal('');
  slug = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadClaimedState();
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

  getClaimedFoliosArray(): number[] {
    return Array.from(this.claimedFolios);
  }

  getAmountForFolio(folio: number): number {
    return this.scratchedResults().find(r => r.folio === folio)?.amount || 0;
  }

  getTotal(): number {
    return this.scratchedResults().reduce((a, r) => a + r.amount, 0);
  }

  isScratched(folio: number): boolean {
    return this.scratchedResults().some(r => r.folio === folio);
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
    // Si ya es mío, ir a raspar
    if (this.claimedFolios.has(c.folio)) {
      this.goScratchMode();
      return;
    }
    if (this.data()?.drawn) {
      this.toast.info('Sorteo ya realizado', 'El ganador fue el folio ' + this.data()?.winner_folio);
      return;
    }
    if (c.status === 'paid') {
      this.toast.info('Boleto pagado', 'El folio ' + this.pad(c.folio) + ' ya esta confirmado');
      return;
    }
    if (c.status !== 'free') {
      this.toast.warning('Boleto tomado', 'El folio ' + this.pad(c.folio) + ' ya lo tiene alguien.');
      return;
    }
    // Validar límite
    const maxPp = (this.data() as any)?.max_tickets_per_person || 3;
    if (this.claimedFolios.size >= maxPp) {
      this.toast.warning('Límite alcanzado', 'Ya tienes ' + maxPp + ' boletos. Máximo permitido.');
      return;
    }
    // Si ya está registrado, reclamar directo
    const savedName = localStorage.getItem('sn_name');
    const savedPhone = localStorage.getItem('sn_phone');
    if (savedName && savedPhone) {
      this.regName = savedName;
      this.regPhone = savedPhone;
      this.claimTicket(c);  // Pasar card directo, sin abrir modal
      return;
    }
    this.selected.set(c);
    this.regName = '';
    this.regPhone = '';
    this.error.set('');
  }

  toggleCard(card: BoardCard) {
    if (this.claimedFolios.has(card.folio)) {
      // No permitir deseleccionar si ya fue raspado
      const anyScratched = this.scratchedResults().length > 0;
      const thisScratched = this.scratchedResults().some(r => r.folio === card.folio);
      if (thisScratched || anyScratched || this.scratchMode()) {
        this.toast.info('Ya empezaste a raspar', 'Ya no puedes cambiar tu selección');
        return;
      }
      this.deselectTicket(card);  // Toggle OFF
    } else {
      this.selectCard(card);  // Toggle ON
    }
  }

  deselectTicket(card: BoardCard) {
    const phone = localStorage.getItem('sn_phone') || '';
    if (!phone) return;
    this.api.releasePublicTicket(this.slug, { folio: card.folio, phone }).subscribe({
      next: () => {
        this.claimedFolios.delete(card.folio);
        delete this.claimedCodes[card.folio];
        this.saveClaimedState();
        const updated = this.cards().map(c =>
          c.folio === card.folio ? { ...c, status: 'free' as any } : c
        );
        this.cards.set(updated);
        this.toast.info('Boleto liberado', 'Folio ' + this.pad(card.folio) + ' ya está disponible');
      },
      error: (err) => this.toast.error('Error', err?.error?.detail || 'No se pudo liberar'),
    });
  }

  goScratchMode() {
    if (this.claimedFolios.size === 0) {
      this.toast.warning('Sin boletos', 'Primero reclama al menos un boleto');
      return;
    }
    this.scratchMode.set(true);
    this.scratchedResults.set([]);
    this.allScratched.set(false);
  }

  exitScratchMode() {
    this.scratchMode.set(false);
  }

  onTicketScratched(result: { folio: number; amount: number }) {
    // Obtener el monto real del backend
    const code = this.claimedCodes[result.folio];
    if (code) {
      this.api.scratch({ folio: result.folio, code, raffle_slug: this.slug }).subscribe({
        next: (res) => {
          this.amountMap[result.folio] = res.amount;
          this.saveClaimedState();
          const realResult = { folio: result.folio, amount: res.amount };
          const results = [...this.scratchedResults().filter(r => r.folio !== result.folio), realResult];
          this.scratchedResults.set(results);
          if (results.length >= this.claimedFolios.size) {
            this.allScratched.set(true);
          }
        },
      });
    } else {
      const results = [...this.scratchedResults(), result];
      this.scratchedResults.set(results);
      if (results.length >= this.claimedFolios.size) {
        this.allScratched.set(true);
      }
    }
  }

  sendAllWhatsApp() {
    const results = this.scratchedResults();
    const name = localStorage.getItem('sn_name') || '';
    const phone = localStorage.getItem('sn_phone') || '';
    const r = this.data();
    let msg = '🎟️ REGISTRO — ' + (r?.title || 'Sorteo Natura') + '\n\n';
    msg += '👤 Nombre: ' + name + '\n';
    msg += '📱 Teléfono: ' + phone + '\n\n';
    msg += 'Mis boletos:\n';
    for (const res of results) {
      msg += '  Folio ' + this.pad(res.folio) + ' → $' + res.amount + '\n';
    }
    msg += '\n💰 Total: $' + results.reduce((a, r2) => a + r2.amount, 0);
    msg += '\n\nPor favor confirma mis boletos. ¡Gracias! 🍀';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    this.toast.success('WhatsApp abierto', 'Envía el mensaje a la organizadora');
  }

  scratchClaimed(card: BoardCard) {
    const code = this.claimedCodes[card.folio];
    if (!code) {
      this.toast.error('Error', 'No se encontró el código de este boleto');
      return;
    }
    this.router.navigate(['/jugar', this.slug], {
      queryParams: { folio: card.folio, cod: code },
    });
  }

  claimTicket(cardOverride?: BoardCard) {
    const sel = cardOverride || this.selected();
    if (!sel) return;
    const name = (this.regName || '').trim();
    const phone = (this.regPhone || '').replace(/\D/g, '');
    if (name.length < 3) {
      this.error.set('Escribe tu nombre completo');
      return;
    }
    if (phone.length < 10) {
      this.error.set('Telefono debe tener 10 digitos');
      return;
    }
    this.claiming.set(true);
    this.error.set('');

    this.api.claimTicket(this.slug, { folio: sel.folio, name, phone }).subscribe({
      next: (res: any) => {
        this.claiming.set(false);
        this.selected.set(null);
        this.error.set('');
        this.toast.success('¡Boleto asignado!', 'Folio ' + this.pad(sel.folio) + ' es tuyo. Puedes reclamar más o rasparlo.');
        // Guardar localmente SIN recargar el tablero
        this.claimedCodes[sel.folio] = res.code;
        this.claimedFolios.add(sel.folio);
        localStorage.setItem('sn_name', this.regName);
        localStorage.setItem('sn_phone', this.regPhone);
        // Actualizar el estado de la tarjeta localmente
        const updated = this.cards().map(card =>
          card.folio === sel.folio ? { ...card, status: 'registered' as any } : card
        );
        this.cards.set(updated);
        // Persistir en localStorage
        this.saveClaimedState();
      },
      error: (err: any) => {
        this.claiming.set(false);
        this.error.set(err?.error?.detail || 'No se pudo asignar el boleto');
        // Si ya fue tomado, recargar el tablero
        if (String(err?.error?.detail || '').includes('tomado')) {
          this.selected.set(null);
          this.ngOnInit();
        }
      },
    });
  }
}
