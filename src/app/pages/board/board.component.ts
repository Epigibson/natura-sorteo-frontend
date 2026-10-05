import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ScratchCardComponent } from '../../core/scratch-card.component';
import { BankDataComponent } from '../../core/bank-data.component';
import { bankDataText } from '../../core/bank-data';
import { ToastService } from '../../core/toast.service';
import { ModalService } from '../../core/modal.service';
import { firstValueFrom } from 'rxjs';

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
  max_tickets_per_person?: number;
  status: string;
  drawn: boolean;
  winner_folio: number | null;
  paid_count: number;
  free_count: number;
  participating_folios?: number[];
  drawn_at?: string | null;
  cards: BoardCard[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ScratchCardComponent, BankDataComponent],
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
                  [amount]="getAmountForFolio(folio)"
                  [preRevealed]="isScratched(folio)"
                  [failed]="scratchFailed().has(folio)"
                  (revealed)="onTicketScratched({ folio: folio, amount: 0 })"
                  (retry)="onTicketScratched({ folio: folio, amount: 0 })"
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

              <p class="ss-pay-hint">
                ✅ Ya solo falta pagar. Transfiere el total con los datos de
                abajo, manda tu captura por WhatsApp y aseguras tu lugar.
              </p>
              <app-bank-data />

              <button class="btn-wa-big" (click)="sendAllWhatsApp()">📲 Enviar a la organizadora por WhatsApp</button>
              @if (paidReported()) {
                <p class="ss-pay-hint">✅ Ya avisamos a la organizadora que pagaste. Ella confirmará tu pago.</p>
              } @else {
                <button class="btn-paid-report" (click)="reportPaid()">✅ Ya pagué</button>
                <p class="paid-hint">Úsalo solo después de transferir: así tu boleto no se libera mientras se confirma.</p>
              }
            </div>
          }

          @if (scratchedResults().length < claimedFolios.size) {
              <button class="btn-back" (click)="exitScratchMode()">← Volver al tablero</button>
            }
        </div>
      } @else {
        <!-- BOTÓN RASPABR BOLETOS -->
        @if (claimedFolios.size > 0 && !loading()) {
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

      <!-- TRANSPARENCIA: folios que participan en el sorteo -->
      @if (!scratchMode() && !loading() && data(); as d) {
        @if ((d.participating_folios?.length || 0) > 0) {
          <section class="participating">
            @if (d.drawn) {
              <h3>🔎 Así se hizo el sorteo</h3>
              <p class="p-sub">
                Participaron <strong>{{ d.participating_folios!.length }}</strong> folios pagados
                @if (d.drawn_at) { el {{ d.drawn_at | date: 'd/M/yyyy, h:mm a' }} }.
                Ganó el folio <strong>{{ pad(d.winner_folio || 0) }}</strong>.
              </p>
            } @else {
              <h3>🎟️ Folios que participan en el sorteo</h3>
              <p class="p-sub">
                <strong>{{ d.participating_folios!.length }}</strong> folios pagados hasta ahora.
                Si ya pagaste y tu folio no aparece, avisa a la organizadora antes del sorteo.
              </p>
            }
            <div class="p-chips">
              @for (f of d.participating_folios!; track f) {
                <span
                  class="p-chip"
                  [class.p-mine]="claimedFolios.has(f)"
                  [class.p-winner]="d.drawn && d.winner_folio === f"
                >{{ pad(f) }}</span>
              }
            </div>
          </section>
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
              Puedes comprar más boletos cuando quieras (hasta el máximo).
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
      .ss-pay-hint {
        color: rgba(255,255,255,0.85);
        font-size: 13.5px;
        line-height: 1.5;
        text-align: center;
        margin: 16px 0 12px;
      }
      .participating {
        margin: 18px auto 0;
        max-width: 720px;
        padding: 16px;
        border-radius: 16px;
        background: #fff;
        border: 1px solid #e5e7eb;
      }
      .participating h3 { margin: 0 0 6px; font-size: 16px; color: #1b5e20; }
      .participating .p-sub { margin: 0 0 12px; font-size: 13px; color: #4b5563; }
      .p-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .p-chip {
        min-width: 34px;
        padding: 4px 8px;
        border-radius: 8px;
        background: #f1f8f2;
        color: #1b5e20;
        font-weight: 700;
        font-size: 13px;
        text-align: center;
      }
      .p-chip.p-mine { outline: 2px solid #c9a227; }
      .p-chip.p-winner { background: #c9a227; color: #fff; }
      .btn-paid-report {
        width: 100%;
        margin-top: 10px;
        padding: 12px;
        border: 2px solid #1b5e20;
        border-radius: 12px;
        background: #fff;
        color: #1b5e20;
        font-weight: 800;
        cursor: pointer;
      }
      .paid-hint {
        margin: 6px 0 0;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
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
export class BoardComponent implements OnInit, OnDestroy {
  data = signal<BoardData | null>(null);
  cards = signal<BoardCard[]>([]);
  loading = signal(true);
  selected = signal<BoardCard | null>(null);
  regName = '';
  regPhone = '';
  claimedFolios = new Set<number>();
  claimedCodes: Record<number, string> = {};
  scratchMode = signal(false);
  scratchFailed = signal<Set<number>>(new Set());
  paidReported = signal(false);
  claimingBusy = false;

  private setScratchFailed(folio: number, on: boolean) {
    const next = new Set(this.scratchFailed());
    if (on) next.add(folio);
    else next.delete(folio);
    this.scratchFailed.set(next);
  }

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
    private modal: ModalService,
  ) {}

  private syncTimer: any = null;
  private onVisible = () => {
    if (document.visibilityState === 'visible') this.syncMine();
  };

  ngOnDestroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    document.removeEventListener('visibilitychange', this.onVisible);
  }

  /**
   * Reconcilia lo guardado en el navegador con el servidor: si Yuri (o la auto-liberación)
   * soltó un boleto, su código cambió y aquí se borra de la vista y del almacenamiento local.
   */
  syncMine() {
    const folios = Array.from(this.claimedFolios);
    if (folios.length === 0) return;
    // El servidor exige el teléfono del titular (junto al código) para confirmar un boleto
    const phone = (localStorage.getItem('sn_phone_' + this.slug) || '').replace(/\D/g, '');
    if (phone.length < 10) return;
    const tickets = folios
      .filter(f => this.claimedCodes[f])
      .map(f => ({ folio: f, code: this.claimedCodes[f] }));
    // Folios sin código guardado no se pueden verificar ni usar: se limpian
    const orphans = folios.filter(f => !this.claimedCodes[f]);
    this.api.checkMine(this.slug, phone, tickets).subscribe({
      next: (res) => {
        const lost = [...orphans, ...res.tickets.filter(t => !t.valid).map(t => t.folio)];
        if (lost.length === 0) return;
        for (const f of lost) {
          this.claimedFolios.delete(f);
          delete this.claimedCodes[f];
          delete this.amountMap[f];
        }
        this.scratchedResults.set(this.scratchedResults().filter(r => !lost.includes(r.folio)));
        if (this.claimedFolios.size === 0) {
          this.scratchMode.set(false);
          this.allScratched.set(false);
          localStorage.removeItem('sn_claimed_' + this.slug);
        } else {
          this.saveClaimedState();
        }
        this.toast.warning(
          'Boleto liberado',
          lost.length === 1
            ? 'El folio ' + this.pad(lost[0]) + ' ya no es tuyo (fue liberado por la organizadora).'
            : 'Los folios ' + lost.map(f => this.pad(f)).join(', ') + ' ya no son tuyos (fueron liberados).',
        );
        this.refreshBoard();
      },
      // Si falla la red no tocamos nada: se reintenta en el siguiente ciclo
      error: () => {},
    });
  }

  /** El servidor baraja los folios en cada petición; ordenarlos evita que el tablero "salte" bajo el dedo. */
  private sorted(cards: BoardCard[]): BoardCard[] {
    return [...cards].sort((a, b) => a.folio - b.folio);
  }

  refreshBoard() {
    this.api.getBoard(this.slug).subscribe({
      next: (d: any) => {
        this.data.set(d);
        this.cards.set(this.sorted(d.cards));
      },
      error: () => {},
    });
  }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.loadClaimedState();
    this.paidReported.set(localStorage.getItem('sn_paidrep_' + this.slug) === '1');
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => this.syncMine(), 60000);
      document.addEventListener('visibilitychange', this.onVisible);
    }
    this.api.getBoard(this.slug).subscribe({
      next: (d: any) => {
        this.data.set(d);
        this.cards.set(this.sorted(d.cards));
        this.loading.set(false);
        this.syncMine();
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
    if (this.claiming() || this.claimingBusy) return; // evita dobles toques
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
    // Validar límite (0 = sin límite; si el servidor no lo informa, 3)
    const maxPp = this.data()?.max_tickets_per_person ?? 3;
    if (maxPp > 0 && this.claimedFolios.size >= maxPp) {
      this.toast.warning('Límite alcanzado', 'Ya tienes ' + maxPp + ' boletos. Máximo permitido.');
      return;
    }
    // Si ya está registrado, reclamar directo
    const savedName = localStorage.getItem('sn_name_' + this.slug);
    const savedPhone = localStorage.getItem('sn_phone_' + this.slug);
    if (savedName && savedPhone) {
      // Ya tenemos sus datos: pedir confirmación en vez de apartar el folio con un solo toque
      this.claimingBusy = true;
      this.modal
        .confirm({
          title: '¿Apartar el folio ' + this.pad(c.folio) + '?',
          message: 'Se apartará a nombre de ' + savedName + '. Podrás soltarlo mientras no lo hayas raspado.',
          confirmLabel: 'Sí, apartar',
          cancelLabel: 'No',
        })
        .then((ok) => {
          this.claimingBusy = false;
          if (!ok) return;
          this.regName = savedName;
          this.regPhone = savedPhone;
          this.claimTicket(c);
        });
      return;
    }
    this.selected.set(c);
    this.regName = '';
    this.regPhone = '';
    this.error.set('');
  }

  toggleCard(card: BoardCard) {
    if (this.claiming() || this.claimingBusy) return;
    if (this.claimedFolios.has(card.folio)) {
      // No permitir deseleccionar si YA FUE RASPADO (este boleto específico)
      const thisScratched = this.scratchedResults().some(r => r.folio === card.folio);
      if (thisScratched) {
        this.toast.info('Ya raspado', 'El folio ' + this.pad(card.folio) + ' ya fue raspado, no se puede quitar');
        return;
      }
      // Soltar un folio es irreversible (el código cambia): pedir confirmación
      this.claimingBusy = true;
      this.modal
        .confirm({
          title: '¿Soltar el folio ' + this.pad(card.folio) + '?',
          message: 'Volverá a quedar disponible para otras personas y perderás tu lugar.',
          confirmLabel: 'Sí, soltar',
          cancelLabel: 'No, conservarlo',
          variant: 'danger',
        })
        .then((ok) => {
          this.claimingBusy = false;
          if (ok) this.deselectTicket(card);
        });
    } else {
      this.selectCard(card);  // Toggle ON — permitido incluso si ya raspó otros
    }
  }

  deselectTicket(card: BoardCard) {
    const phone = localStorage.getItem('sn_phone_' + this.slug) || '';
    const code = this.claimedCodes[card.folio] || '';
    if (!phone || !code) return;
    this.api.releasePublicTicket(this.slug, { folio: card.folio, phone, code }).subscribe({
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
    // No se borra lo ya raspado: esos boletos se muestran descubiertos
    this.allScratched.set(this.scratchedResults().length >= this.claimedFolios.size);
  }

  exitScratchMode() {
    this.scratchMode.set(false);
  }

  onTicketScratched(result: { folio: number; amount: number }) {
    const code = this.claimedCodes[result.folio];
    if (!code) {
      this.setScratchFailed(result.folio, true);
      this.toast.error('Error', 'No se encontró el código de este boleto');
      return;
    }
    this.setScratchFailed(result.folio, false);
    this.requestScratch(result.folio, code, 0);
  }

  /** Pide el monto al servidor; reintenta solo ante fallos de red/servidor y ofrece "Reintentar" si no se logra. */
  private requestScratch(folio: number, code: string, attempt: number) {
    this.api.scratch({ folio, code, raffle_slug: this.slug }).subscribe({
      next: (res) => {
        this.amountMap[folio] = res.amount;
        const results = [...this.scratchedResults().filter(r => r.folio !== folio), { folio, amount: res.amount }];
        this.scratchedResults.set(results);
        this.saveClaimedState(); // después de actualizar: antes guardaba el estado anterior
        if (results.length >= this.claimedFolios.size) {
          this.allScratched.set(true);
        }
      },
      error: (err) => {
        const transient = err?.status === 0 || err?.status >= 500; // sin red o servidor despertando
        if (transient && attempt < 2) {
          setTimeout(() => this.requestScratch(folio, code, attempt + 1), 2500 * (attempt + 1));
          return;
        }
        this.setScratchFailed(folio, true);
        this.toast.error('No se pudo revelar el monto', err?.error?.detail || 'Revisa tu conexión y toca Reintentar');
      },
    });
  }

  /** "Ya pagué": avisa a la organizadora y pausa la liberación automática de estos boletos. */
  async reportPaid() {
    const ok = await this.modal.confirm({
      title: '¿Ya hiciste tu pago?',
      message: 'Avisaremos a la organizadora para que confirme tu pago y tu boleto no se libere. Úsalo solo si ya transferiste.',
      confirmLabel: 'Sí, ya pagué',
      cancelLabel: 'Todavía no',
    });
    if (!ok) return;
    const results = await Promise.allSettled(
      Array.from(this.claimedFolios).map(folio =>
        firstValueFrom(this.api.reportPaid(this.slug, { folio, code: this.claimedCodes[folio] || '' })),
      ),
    );
    if (results.every(r => r.status === 'fulfilled')) {
      localStorage.setItem('sn_paidrep_' + this.slug, '1');
      this.paidReported.set(true);
      this.toast.success('Listo', 'Avisamos a la organizadora. Confirmará tu pago pronto.');
    } else {
      this.toast.error('No se pudo avisar', 'Intenta de nuevo o mándale tu captura por WhatsApp.');
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
    msg += '\n\n' + bankDataText() + '\n\n';
    msg += 'Voy a pagar y te mando la captura. Por favor confirma mis boletos. ¡Gracias! 🍀';
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
          this.refreshBoard();
        }
      },
    });
  }
}
