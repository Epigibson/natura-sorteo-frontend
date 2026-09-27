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
            <label class="field-label">Nombre completo</label>
            <input class="field-input" [(ngModel)]="regName" placeholder="Ana García López" autocomplete="name" />
            <label class="field-label">Número de WhatsApp / celular</label>
            <input class="field-input" [(ngModel)]="regPhone" placeholder="55 1234 5678" type="tel" maxlength="15" />
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
        background: linear-gradient(165deg, #050a15 0%, #0a1628 35%, #0d2137 65%, #0a1628 100%);
        padding: 28px 16px 60px;
        position: relative;
        overflow: hidden;
      }
      .board-page::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(201,162,39,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,162,39,0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        pointer-events: none;
      }
      .top {
        text-align: center;
        color: #fff;
        margin-bottom: 28px;
        position: relative;
        z-index: 2;
      }
      .brand {
        font-size: 11px;
        letter-spacing: 5px;
        text-transform: uppercase;
        color: rgba(201,162,39,0.7);
        font-weight: 700;
      }
      .top h1 {
        font-size: clamp(22px, 5vw, 32px);
        font-weight: 900;
        margin: 10px 0 6px;
        color: #fff;
      }
      .sub {
        font-size: 14px;
        color: rgba(255,255,255,0.5);
        margin-bottom: 16px;
      }
      .mini-stats {
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ms {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 6px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.8);
        backdrop-filter: blur(8px);
      }
      .ms-taken {
        background: rgba(255,152,0,0.15);
        border-color: rgba(255,152,0,0.25);
        color: #ffb74d;
      }
      .ms-paid {
        background: rgba(76,175,80,0.15);
        border-color: rgba(76,175,80,0.25);
        color: #81c784;
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
      .sc-info strong { color: #64b5f6; }
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
      .legend {
        display: flex;
        justify-content: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        position: relative;
        z-index: 2;
      }
      .leg-item {
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,0.6);
        font-size: 12px;
        font-weight: 600;
        background: rgba(255,255,255,0.05);
        padding: 5px 12px;
        border-radius: 999px;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 4px;
      }
      .dot-free { background: rgba(76,175,80,0.5); border: 1px solid rgba(76,175,80,0.7); }
      .dot-mine { background: rgba(33,150,243,0.5); border: 1px solid rgba(33,150,243,0.7); }
      .dot-taken { background: rgba(255,152,0,0.5); border: 1px solid rgba(255,152,0,0.7); }
      .dot-paid { background: rgba(76,175,80,0.7); border: 1px solid rgba(76,175,80,0.9); }
      .dot-winner { background: rgba(255,215,0,0.5); border: 1px solid rgba(255,215,0,0.7); }
      .loading {
        text-align: center;
        padding: 60px;
        color: rgba(255,255,255,0.5);
        font-size: 15px;
        position: relative;
        z-index: 2;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 14px;
        max-width: 720px;
        margin: 0 auto;
        position: relative;
        z-index: 2;
      }
      .tile {
        aspect-ratio: 1;
        border-radius: 18px;
        padding: 14px 10px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
        border: none;
      }
      .tile:hover {
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        z-index: 3;
      }
      .tile:active {
        transform: scale(0.94);
      }
      .tile-free {
        background: linear-gradient(145deg, #43a047, #2e7d32);
        box-shadow: 0 4px 16px rgba(67,160,71,0.35), inset 0 2px 0 rgba(255,255,255,0.15);
      }
      .tile-free:hover {
        background: linear-gradient(145deg, #66bb6a, #43a047);
        box-shadow: 0 12px 36px rgba(67,160,71,0.5), inset 0 2px 0 rgba(255,255,255,0.2);
      }
      .tile-free .tile-folio { color: #ffffff; }
      .tile-free .tile-status { color: rgba(255,255,255,0.75); }
      .tile-free .tile-action { color: rgba(255,255,255,0.7); }
      .tile-taken {
        background: linear-gradient(145deg, #ef6c00, #e65100);
        box-shadow: 0 4px 16px rgba(239,108,0,0.3), inset 0 2px 0 rgba(255,255,255,0.12);
        opacity: 0.88;
      }
      .tile-taken:hover {
        transform: none;
        box-shadow: 0 4px 16px rgba(239,108,0,0.3);
      }
      .tile-taken .tile-folio { color: #ffffff; }
      .tile-taken .tile-status { color: rgba(255,255,255,0.7); }
      .tile-paid {
        background: linear-gradient(145deg, #1b5e20, #0d3b12);
        box-shadow: 0 4px 16px rgba(27,94,32,0.4), inset 0 2px 0 rgba(255,255,255,0.1);
      }
      .tile-paid .tile-folio { color: #a5d6a7; }
      .tile-paid .tile-status { color: rgba(165,214,167,0.8); }
      .tile-mine {
        background: linear-gradient(145deg, #1e88e5, #1565c0);
        box-shadow: 0 6px 24px rgba(30,136,229,0.45), inset 0 2px 0 rgba(255,255,255,0.18);
        border: 2.5px solid #64b5f6;
      }
      .tile-mine:hover {
        background: linear-gradient(145deg, #42a5f5, #1e88e5);
        box-shadow: 0 12px 36px rgba(30,136,229,0.55), inset 0 2px 0 rgba(255,255,255,0.2);
      }
      .tile-mine .tile-folio { color: #ffffff; }
      .tile-mine .tile-action { color: #e3f2fd; font-weight: 800; }
      .tile-winner {
        background: linear-gradient(145deg, #f9a825, #f57f17);
        box-shadow: 0 8px 32px rgba(249,168,37,0.5), inset 0 2px 0 rgba(255,255,255,0.25);
        border: 3px solid #fdd835;
      }
      .tile-winner .tile-folio { color: #ffffff; }
      .tile-folio {
        font-size: 30px;
        font-weight: 900;
        line-height: 1;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .tile-status {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.2px;
      }
      .tile-action {
        font-size: 9px;
        font-weight: 800;
        margin-top: 3px;
        letter-spacing: 0.5px;
        opacity: 0.85;
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
        color: rgba(255,255,255,0.6);
        font-size: 13px;
        font-weight: 700;
        margin-top: 6px;
      }
      .ss-results {
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(201,162,39,0.2);
        border-radius: 22px;
        padding: 28px;
        margin-top: 32px;
        color: #fff;
      }
      .ss-results h3 {
        text-align: center;
        margin: 0 0 20px;
        font-size: 22px;
        font-weight: 900;
      }
      .ss-result-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        margin-bottom: 8px;
      }
      .ss-r-folio { font-weight: 700; color: rgba(255,255,255,0.7); }
      .ss-r-amount { font-weight: 900; color: #f0c94e; font-size: 16px; }
      .ss-total {
        text-align: right;
        font-size: 20px;
        padding: 14px 16px;
        color: #f0c94e;
        border-top: 1px solid rgba(255,255,255,0.06);
        margin-top: 8px;
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
        padding: 14px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 14px;
        background: rgba(255,255,255,0.04);
        color: rgba(255,255,255,0.6);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .btn-back:hover {
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.8);
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(5,10,21,0.7);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9000;
        padding: 18px;
      }
      .dialog {
        background: linear-gradient(165deg, #0f2137 0%, #0d1a2e 100%);
        border: 1px solid rgba(76,175,80,0.15);
        border-radius: 24px;
        padding: 32px 28px 28px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        position: relative;
        overflow: hidden;
      }
      .dialog::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #43a047, #c9a227, #43a047);
      }
      .d-icon {
        font-size: 42px;
        text-align: center;
        margin-bottom: 10px;
      }
      .dialog h3 {
        text-align: center;
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 900;
        color: #fff;
      }
      .msg {
        text-align: center;
        color: rgba(255,255,255,0.5);
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      .msg strong {
        color: #81c784;
      }
      .msg.legal {
        font-size: 11px;
        margin-top: 10px;
        margin-bottom: 0;
        padding: 10px;
        background: rgba(255,255,255,0.03);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .dialog label,
      .field-label {
        display: block;
        font-size: 11px;
        font-weight: 800;
        color: #81c784;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 14px 0 7px;
      }
      .dialog input,
      .field-input {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid rgba(76,175,80,0.2);
        border-radius: 14px;
        font-size: 16px;
        font-weight: 600;
        outline: none;
        box-sizing: border-box;
        background: rgba(255,255,255,0.06);
        color: #fff;
        transition: all 0.2s;
        font-family: inherit;
      }
      .dialog input::placeholder,
      .field-input::placeholder {
        color: rgba(255,255,255,0.25);
        font-weight: 400;
      }
      .dialog input:focus,
      .field-input:focus {
        border-color: #4caf50;
        background: rgba(255,255,255,0.1);
        box-shadow: 0 0 0 4px rgba(76,175,80,0.15);
      }
      .actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .btn-ghost {
        flex: 1;
        padding: 14px 18px;
        border-radius: 14px;
        border: 1.5px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.04);
        color: rgba(255,255,255,0.6);
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .btn-ghost:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.8);
      }
      .btn-solid {
        flex: 1.3;
        padding: 14px 18px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #2e7d32, #43a047);
        color: #fff;
        font-weight: 800;
        font-size: 15px;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 6px 20px rgba(67,160,71,0.35);
        transition: all 0.2s;
      }
      .btn-solid:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(67,160,71,0.45);
      }
      .btn-solid:disabled {
        opacity: 0.5;
        transform: none;
        cursor: not-allowed;
      }
      .error {
        margin-top: 14px;
        padding: 12px 14px;
        background: rgba(198,40,40,0.12);
        border: 1px solid rgba(198,40,40,0.2);
        color: #ef9a9a;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
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
    const key = 'sn_claimed_' + this.slug;
    localStorage.setItem(key, JSON.stringify({
      folios: Array.from(this.claimedFolios),
      codes: this.claimedCodes,
      scratched: this.scratchedResults(),
    }));
  }

  loadClaimedState() {
    try {
      const raw = localStorage.getItem('sn_claimed_' + this.slug);
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
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.loadClaimedState();
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
    const savedName = localStorage.getItem('sn_name_' + this.slug);
    const savedPhone = localStorage.getItem('sn_phone_' + this.slug);
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
    const phone = localStorage.getItem('sn_phone_' + this.slug) || '';
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
    const name = localStorage.getItem('sn_name_' + this.slug) || '';
    const phone = localStorage.getItem('sn_phone_' + this.slug) || '';
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
        localStorage.setItem('sn_name_' + this.slug, this.regName);
        localStorage.setItem('sn_phone_' + this.slug, this.regPhone);
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
