import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ModalService } from '../../core/modal.service';
import { Raffle, RaffleStats, Ticket } from '../../core/models';

@Component({
  selector: 'app-raffle-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (raffle(); as r) {
      <div class="page">
        <a routerLink="/dashboard" class="back">← Sorteos</a>

        <header class="head">
          <div>
            <span class="badge" [class]="'badge-' + r.status">{{ statusLabel(r.status) }}</span>
            <h1>{{ r.title }}</h1>
            <p class="prize">🎁 {{ r.prize }} · valor \${{ r.prize_value }}</p>
            <div class="board-link">
              <span class="bl-label">🔗 Enlace del tablero:</span>
              <code class="bl-url">{{ boardUrl() }}</code>
              <div class="bl-actions">
                <button class="btn-sm btn-copy" (click)="copyBoardLink()">📋 Copiar tablero</button>
                <button class="btn-sm btn-wa" (click)="shareBoardWhatsApp()">📲 WhatsApp</button>
                <a class="btn-sm btn-open" [href]="boardUrl()" target="_blank">👁 Ver tablero</a>
                <button class="btn-sm btn-copy" (click)="copyLandingLink()">📋 Landing</button>
                <a class="btn-sm btn-open" [href]="landingUrl()" target="_blank">👁 Ver landing</a>
                <button class="btn-sm btn-copy" (click)="editRaffle()">✏️ Editar</button>
                <button class="btn-sm btn-open" (click)="exportBackup()">💾 Backup</button>
                <button class="btn-sm btn-open" (click)="showQR()">📱 QR</button>
                <button class="btn-sm btn-danger" (click)="deleteRaffle()">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
          <div class="head-actions">
            @if (r.status === 'open') {
              <button class="btn-ghost" (click)="closeRaffle()">Cerrar venta</button>
            }
            @if (r.status !== 'drawn') {
              <button class="btn-primary" (click)="draw()" [disabled]="(stats()?.paid || 0) === 0">
                🎲 Sortear premio
              </button>
            }
          </div>
        </header>

        @if (r.status === 'drawn' && r.winner; as winner) {
          <div class="winner-banner">
            <div class="trophy">🏆</div>
            <div>
              <div class="w-title">¡Tenemos ganador!</div>
              <div class="w-name">
                Folio {{ winner.folio }} — {{ winner.participant?.name || 'Ganador' }}
              </div>
              <div class="w-amount">Boleto de \${{ winner.amount }}</div>
            </div>
          </div>
        }

        @if (stats(); as s) {
          <div class="stats">
            <div class="stat">
              <div class="n">{{ s.paid }}</div>
              <div class="t">Pagados</div>
            </div>
            <div class="stat">
              <div class="n">{{ s.scratched + s.registered + s.delivered }}</div>
              <div class="t">En proceso</div>
            </div>
            <div class="stat">
              <div class="n">{{ s.free }}</div>
              <div class="t">Libres</div>
            </div>
            <div class="stat">
              <div class="n">\${{ s.revenue_confirmed }}</div>
              <div class="t">Cobrado</div>
            </div>
            <div class="stat">
              <div class="n">\${{ s.revenue_expected }}</div>
              <div class="t">Esperado</div>
            </div>
            <div class="stat">
              <div class="n">{{ s.participants }}</div>
              <div class="t">Personas</div>
            </div>
          </div>
        }

        <div class="toolbar">
          <h2>Boletos ({{ tickets().length }})</h2>
          <div class="filters">
            <button
              class="chip"
              [class.active]="filter() === ''"
              (click)="filter.set('')"
            >
              Todos
            </button>
            <button
              class="chip"
              [class.active]="filter() === 'free'"
              (click)="filter.set('free')"
            >
              Libres
            </button>
            <button
              class="chip"
              [class.active]="filter() === 'paid'"
              (click)="filter.set('paid')"
            >
              Pagados
            </button>
            <button class="btn-export" (click)="exportExcel()" [disabled]="exporting()">
              {{ exporting() ? 'Generando…' : '⬇ Exportar Excel' }}
            </button>
          </div>
        </div>

        <div class="tickets">
          @for (t of filtered(); track t.id) {
            <div class="ticket" [class]="'st-' + t.status">
              <div class="t-folio">
                <div class="f-num">{{ t.folio | number: '2.0-0' }}</div>
                <div class="f-amt">\${{ t.amount }}</div>
              </div>
              <div class="t-body">
                <div class="t-name">
                  {{ t.participant?.name || '— sin asignar —' }}
                </div>
                <div class="t-meta">
                  <span class="code-big" (click)="copyCode(t)" title="Clic para copiar">
                    🔑 {{ t.access_code }} 📋
                  </span>
                  @if (t.participant?.phone) {
                    <span class="tel">{{ t.participant?.phone }}</span>
                  }
                  <span class="st-label">{{ statusLabel(t.status) }}</span>
                </div>
              </div>
              <div class="t-actions">
                @if (t.status === 'free') {
                  <button class="btn-sm" (click)="openAssign(t)">Entregar</button>
                }
                @if (t.status === 'delivered' || t.status === 'registered' || t.status === 'scratched') {
                  <button class="btn-sm btn-pay" (click)="pay(t)">Cobrar</button>
                  <button class="btn-sm btn-wa" (click)="sendReminder(t)" title="Recordar pago">
                    ⏰
                  </button>
                  <button class="btn-sm btn-wa" (click)="sendWhatsApp(t)" title="Enviar por WhatsApp">
                    📲
                  </button>
                  <button class="btn-sm btn-danger" (click)="release(t)">Liberar</button>
                }
                @if (t.status === 'paid') {
                  <span class="ok">✅</span>
                }
                @if (t.status === 'free' || t.status === 'paid') {
                  <button class="btn-sm btn-wa" (click)="sendWhatsApp(t)" title="Enviar por WhatsApp">
                    📲
                  </button>
                }
                <button class="btn-sm btn-copy" (click)="copyLink(t)" title="Copiar enlace">
                  🔗
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Modal QR -->
        @if (qrOpen()) {
          <div class="overlay" (click)="qrOpen.set(false)">
            <div class="draw-modal" (click)="$event.stopPropagation()">
              <h3 style="margin:0 0 16px; color:#1f2937;">📱 QR del tablero</h3>
              <img [src]="getQRUrl()" alt="QR" style="width:220px; height:220px; border-radius:16px; border:2px solid #e5e7eb;" />
              <p style="color:#6b7280; font-size:13px; margin:14px 0 20px;">
                Escanea para ir al tablero de boletos
              </p>
              <button class="btn-save" (click)="qrOpen.set(false)">Cerrar</button>
            </div>
          </div>
        }

        <!-- Modal SORTEO animado -->
        @if (drawOpen()) {
          <div class="overlay draw-overlay">
            <div class="draw-modal" (click)="$event.stopPropagation()">
              @if (drawSpinning()) {
                <div class="draw-spinner">
                  <div class="spinner-emoji">🎰</div>
                  <h2>Sorteando…</h2>
                  <div class="spinner-bar"><div class="spinner-fill"></div></div>
                  <p>La suerte está echada</p>
                </div>
              } @else if (drawResult()) {
                <div class="draw-winner">
                  <div class="dw-celebration">🎉🏆🎉</div>
                  <div class="dw-label">¡TENEMOS GANADOR!</div>
                  <div class="dw-name">{{ drawResult().participant?.name || 'Ganador' }}</div>
                  <div class="dw-folio">Folio {{ drawResult().folio }}</div>
                  <div class="dw-amount">Boleto de \${{ drawResult().amount }}</div>
                  <button class="btn-save" (click)="drawOpen.set(false)">Cerrar</button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Modal editar sorteo PREMIUM -->
        @if (editOpen()) {
          <div class="overlay" (click)="editOpen.set(false)">
            <div class="edit-modal" (click)="$event.stopPropagation()">
              <div class="edit-header">
                <div class="edit-icon">✏️</div>
                <h3>Editar sorteo</h3>
                <p class="edit-sub">Actualiza los detalles de tu rifa</p>
              </div>

              <div class="edit-body">
                <div class="field">
                  <label>🏆 Título del sorteo</label>
                  <input [(ngModel)]="editTitle" placeholder="Rifa Natura Febrero" />
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>🎁 Premio</label>
                    <input [(ngModel)]="editPrize" placeholder="Set Krono K" />
                  </div>
                  <div class="field field-sm">
                    <label>💰 Valor ($)</label>
                    <input type="number" [(ngModel)]="editPrizeValue" min="0" />
                  </div>
                </div>

                <div class="field">
                  <label>📅 Fecha del sorteo</label>
                  <input type="date" [(ngModel)]="editDrawDate" />
                </div>

                <div class="field">
                  <label>🎥 Enlace de videollamada (Meet / Zoom)</label>
                  <input [(ngModel)]="editMeetUrl" placeholder="https://meet.google.com/xxx-yyyy-zzz" />
                  <div class="upload-hint">El sorteo siempre es a las 12:00 PM. El enlace se muestra en la landing.</div>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label>📝 Notas</label>
                    <textarea [(ngModel)]="editNotes" rows="2" placeholder="Notas internas…"></textarea>
                  </div>
                  <div class="field field-sm">
                    <label>🎟️ Máx boletos/persona</label>
                    <input type="number" [(ngModel)]="editMaxTickets" min="0" />
                  </div>
                </div>

                <div class="field">
                  <label>📸 Foto del producto</label>
                  <label class="upload-zone" [class.has-image]="editImageUrl">
                    @if (editImageUrl) {
                      <img [src]="editImageUrl" class="upload-preview" alt="preview" />
                      <span class="upload-text">Cambiar foto</span>
                    } @else {
                      <span class="upload-icon">📷</span>
                      <span class="upload-text">Toca para subir una foto</span>
                      <span class="upload-hint">JPG, PNG o WebP · máx 2 MB</span>
                    }
                    <input type="file" accept="image/*" (change)="onPhotoChange($event)" />
                  </label>
                </div>
              </div>

              <div class="edit-footer">
                <button class="btn-cancel" (click)="editOpen.set(false)">Cancelar</button>
                <button class="btn-save" (click)="saveEdit()" [disabled]="editSaving()">
                  @if (editSaving()) {
                    <span class="spinner"></span> Guardando…
                  } @else {
                    ✅ Guardar cambios
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modal asignar -->
        @if (selected(); as sel) {
          <div class="modal-bg" (click)="selected.set(null)">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3>Entregar folio {{ sel.folio }}</h3>
              <p class="m-sub">
                Se le dará el código <strong>{{ sel.access_code }}</strong> al participante.
                Monto oculto: <strong>\${{ sel.amount }}</strong>
              </p>
              <label>Nombre (opcional, se puede registrar después)</label>
              <input [(ngModel)]="assignName" placeholder="Ana García" />
              <label>Teléfono (opcional)</label>
              <input [(ngModel)]="assignPhone" placeholder="55 1234 5678" />
              <div class="m-actions">
                <button class="btn-ghost" (click)="selected.set(null)">Cancelar</button>
                <button class="btn-primary" (click)="confirmAssign()">Entregar boleto</button>
              </div>
              @if (modalError()) {
                <div class="error">{{ modalError() }}</div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="loading">Cargando sorteo…</div>
    }
  `,
  styles: [
    `
      .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 20px 80px;
      }
      .back {
        color: #1b5e20;
        font-weight: 600;
        text-decoration: none;
        font-size: 14px;
      }
      .head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        margin: 14px 0 22px;
      }
      @media (max-width: 640px) {
        .page { padding: 16px 12px 60px; }
        .head { flex-direction: column; }
        .head-actions { flex-direction: column; width: 100%; }
        .head-actions button { width: 100%; }
        .stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .stat { padding: 10px 6px; }
        .stat .n { font-size: 18px; }
        .toolbar { flex-direction: column; align-items: stretch; }
        .filters { flex-wrap: wrap; }
        .ticket { grid-template-columns: 56px 1fr; gap: 8px; padding: 10px; }
        .t-actions { grid-column: 1 / -1; justify-content: flex-end; flex-wrap: wrap; }
        .bl-actions { flex-wrap: wrap; }
        .modal { max-width: 100%; }
        h1 { font-size: 20px; }
      }
      .badge {
        font-size: 11px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
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
      h1 {
        margin: 8px 0 4px;
        font-size: 26px;
        color: #1f2937;
      }
      .prize {
        color: #6b7280;
        margin: 0 0 8px;
      }
      .link-pub {
        font-size: 13px;
        color: #6b7280;
      }
      .link-pub code {
        background: #f3f4f6;
        padding: 3px 8px;
        border-radius: 6px;
        color: #1b5e20;
        font-weight: 700;
      }
      .board-link {
        margin-top: 12px;
        background: #fff;
        border: 1.5px solid #c8e6c9;
        border-radius: 14px;
        padding: 14px 16px;
      }
      .bl-label {
        font-size: 12px;
        font-weight: 800;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        display: block;
        margin-bottom: 6px;
      }
      .bl-url {
        display: block;
        background: #f3f4f6;
        padding: 8px 12px;
        border-radius: 8px;
        color: #374151;
        font-family: monospace;
        font-size: 12.5px;
        word-break: break-all;
        margin-bottom: 10px;
      }
      .bl-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .btn-open {
        display: inline-flex;
        align-items: center;
        padding: 7px 12px;
        border-radius: 9px;
        border: 1.5px solid #c8e6c9;
        background: #fff;
        color: #1b5e20;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }
      .head-actions {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .btn-primary {
        padding: 12px 18px;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        font-size: 14px;
      }
      .btn-primary:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .btn-ghost {
        padding: 12px 16px;
        background: #fff;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        color: #6b7280;
        font-weight: 600;
        cursor: pointer;
      }
      .winner-banner {
        display: flex;
        gap: 16px;
        align-items: center;
        background: linear-gradient(135deg, #fff8e1, #ffecb3);
        border: 2px solid #ffe082;
        border-radius: 18px;
        padding: 22px;
        margin-bottom: 22px;
      }
      .trophy {
        font-size: 42px;
      }
      .w-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #8d6e00;
        font-weight: 700;
      }
      .w-name {
        font-size: 22px;
        font-weight: 900;
        color: #5d4037;
      }
      .w-amount {
        color: #8d6e00;
        font-weight: 600;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
        margin-bottom: 26px;
      }
      .stat {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 14px;
        text-align: center;
      }
      .stat .n {
        font-size: 22px;
        font-weight: 900;
        color: #1b5e20;
      }
      .stat .t {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        font-weight: 700;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        flex-wrap: wrap;
        gap: 10px;
      }
      .toolbar h2 {
        margin: 0;
        font-size: 18px;
        color: #1f2937;
      }
      .filters {
        display: flex;
        gap: 8px;
      }
      .chip {
        padding: 7px 14px;
        border-radius: 999px;
        border: 1.5px solid #e5e7eb;
        background: #fff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        color: #6b7280;
      }
      .chip.active {
        background: #1b5e20;
        border-color: #1b5e20;
        color: #fff;
      }
      .btn-export {
        padding: 7px 14px;
        border-radius: 999px;
        border: 1.5px solid #c9a227;
        background: #fff8e1;
        color: #8d6e00;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-export:hover {
        background: #ffecb3;
      }
      .btn-export:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .tickets {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .ticket {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: 12px;
        align-items: center;
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 12px 14px;
      }
      .ticket.st-paid {
        border-color: #a5d6a7;
        background: #f1f8f2;
      }
      .ticket.st-scratched {
        border-color: #90caf9;
      }
      .t-folio {
        text-align: center;
      }
      .f-num {
        font-size: 18px;
        font-weight: 900;
        color: #1b5e20;
      }
      .f-amt {
        font-size: 13px;
        font-weight: 700;
        color: #c9a227;
      }
      .t-name {
        font-weight: 700;
        color: #1f2937;
        font-size: 14px;
      }
      .t-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 3px;
      }
      .code {
        font-family: monospace;
        background: #f3f4f6;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        color: #374151;
      }
      .code-big {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-family: monospace;
        background: #fff8e1;
        border: 1.5px solid #ffe082;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 800;
        color: #e65100;
        cursor: pointer;
        letter-spacing: 1px;
        transition: background 0.15s;
      }
      .code-big:hover {
        background: #ffecb3;
      }
      .tel {
        font-size: 12px;
        color: #6b7280;
      }
      .st-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #6b7280;
      }
      .t-actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .btn-sm {
        padding: 7px 12px;
        border-radius: 9px;
        border: 1.5px solid #c8e6c9;
        background: #fff;
        color: #1b5e20;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-pay {
        background: #1b5e20;
        border-color: #1b5e20;
        color: #fff;
      }
      .btn-danger {
        border-color: #ffcdd2;
        color: #c62828;
      }
      .btn-wa {
        border-color: #a5e6b5;
        background: #e8f8ee;
        color: #128c4a;
        font-size: 13px;
      }
      .btn-wa:hover {
        background: #d4f1de;
      }
      .btn-copy {
        border-color: #e5e7eb;
      }
      .ok {
        font-size: 18px;
      }
      .loading {
        text-align: center;
        padding: 80px;
        color: #6b7280;
      }
      .draw-overlay { background: rgba(10,20,10,0.85); }
      .draw-modal {
        background: #fff; border-radius: 24px; padding: 40px 32px; width: 100%; max-width: 420px;
        text-align: center; animation: editPop 0.25s cubic-bezier(0.21,1.02,0.73,1);
      }
      .draw-spinner .spinner-emoji {
        font-size: 64px; animation: slotSpin 0.5s ease-in-out infinite;
      }
      @keyframes slotSpin {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.1) rotate(-5deg); }
        75% { transform: scale(1.1) rotate(5deg); }
      }
      .draw-spinner h2 { margin: 16px 0; font-size: 24px; color: #1f2937; }
      .spinner-bar {
        height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin: 16px 0;
      }
      .spinner-fill {
        height: 100%; background: linear-gradient(90deg, #4caf50, #c9a227);
        border-radius: 999px; animation: fillBar 3s linear forwards;
      }
      @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
      .draw-spinner p { color: #6b7280; }
      .draw-winner .dw-celebration { font-size: 42px; margin-bottom: 12px; }
      .dw-label {
        font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
        color: #c9a227; font-weight: 800; margin-bottom: 8px;
      }
      .dw-name {
        font-size: 28px; font-weight: 900; color: #1b5e20; margin-bottom: 4px;
      }
      .dw-folio { font-size: 16px; color: #6b7280; font-weight: 700; margin-bottom: 8px; }
      .dw-amount {
        font-size: 18px; color: #c9a227; font-weight: 800;
        margin-bottom: 24px; padding: 10px; background: #fff8e1; border-radius: 12px;
      }
      .overlay {
        position: fixed; inset: 0; background: rgba(10,20,10,0.6); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; z-index: 9000; padding: 18px;
      }
      .edit-modal {
        background: #fff; border-radius: 24px; width: 100%; max-width: 520px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.3); overflow: hidden;
        animation: editPop 0.25s cubic-bezier(0.21,1.02,0.73,1);
        max-height: 92vh; display: flex; flex-direction: column;
      }
      @keyframes editPop {
        from { opacity: 0; transform: scale(0.94) translateY(16px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .edit-header {
        background: linear-gradient(135deg, #0d3b12, #1b5e20, #2e7d32);
        color: #fff; padding: 28px 28px 24px; text-align: center;
        position: relative; overflow: hidden;
      }
      .edit-header::before {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.06), transparent 30%);
        animation: editShine 6s linear infinite;
      }
      @keyframes editShine {
        to { transform: rotate(360deg); }
      }
      .edit-icon { font-size: 36px; margin-bottom: 8px; position: relative; }
      .edit-header h3 { margin: 0; font-size: 22px; font-weight: 800; position: relative; }
      .edit-sub { margin: 6px 0 0; font-size: 13px; opacity: 0.75; position: relative; }
      .edit-body { padding: 24px 28px 16px; overflow-y: auto; flex: 1; }
      .field { margin-bottom: 16px; }
      .field-row { display: grid; grid-template-columns: 1fr 120px; gap: 12px; }
      .field label {
        display: block; font-size: 12px; font-weight: 700; color: #374151;
        margin-bottom: 6px;
      }
      .field input, .field textarea {
        width: 100%; padding: 12px 14px; border: 2px solid #e5e7eb; border-radius: 14px;
        font-size: 15px; outline: none; box-sizing: border-box; font-family: inherit;
        transition: border-color 0.2s, box-shadow 0.2s; background: #fafafa;
      }
      .field input:focus, .field textarea:focus {
        border-color: #4caf50; background: #fff;
        box-shadow: 0 0 0 4px rgba(76,175,80,0.12);
      }
      .upload-zone {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 2.5px dashed #c8e6c9; border-radius: 18px; padding: 28px 16px;
        cursor: pointer; transition: all 0.25s; background: #f0f9f1; text-align: center;
        position: relative; overflow: hidden;
      }
      .upload-zone:hover {
        border-color: #43a047; background: #e8f5e9;
        transform: scale(1.01);
        box-shadow: 0 4px 16px rgba(76,175,80,0.15);
      }
      .upload-zone.has-image {
        padding: 12px; border-style: solid; border-color: #a5d6a7;
        background: #fff;
      }
      .upload-zone input[type="file"] {
        position: absolute; inset: 0; opacity: 0; cursor: pointer;
      }
      .upload-preview {
        max-width: 100%; max-height: 160px; border-radius: 12px; object-fit: cover;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      .upload-icon { font-size: 42px; margin-bottom: 8px; }
      .upload-text { font-size: 15px; font-weight: 800; color: #2e7d32; margin-top: 6px; }
      .upload-hint { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .edit-footer {
        display: flex; gap: 12px; padding: 18px 28px 26px;
        border-top: 1px solid #e8e4d9; background: #f5f2eb;
      }
      .btn-cancel {
        flex: 1; padding: 15px; border-radius: 14px; border: 2px solid #d1d5db;
        background: #fff; color: #4b5563; font-weight: 700; font-size: 15px; cursor: pointer;
        transition: all 0.2s;
      }
      .btn-cancel:hover {
        border-color: #9ca3af; background: #f3f4f6;
        transform: translateY(-1px);
      }
      .btn-save {
        flex: 1.5; padding: 15px 20px; border-radius: 14px; border: none;
        background: linear-gradient(135deg, #1b5e20, #2e7d32, #43a047);
        background-size: 200% 200%;
        color: #fff; font-weight: 800; font-size: 15px; cursor: pointer;
        box-shadow: 0 8px 24px rgba(27,94,32,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
        animation: btnShine 3s ease-in-out infinite;
      }
      .btn-save:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(27,94,32,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
      }
      .btn-save:disabled {
        opacity: 0.5; transform: none; cursor: not-allowed;
        animation: none;
      }
      .spinner {
        width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .modal-bg {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 16px;
      }
      .modal {
        background: #faf7f0;
        border-radius: 18px;
        padding: 26px;
        width: 100%;
        max-width: 420px;
      }
      .modal h3 {
        margin: 0 0 6px;
        color: #1f2937;
      }
      .m-sub {
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .modal label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        margin: 12px 0 5px;
      }
      .modal input {
        width: 100%;
        padding: 12px;
        border: 2px solid #c8e6c9;
        border-radius: 11px;
        font-size: 15px;
        outline: none;
        box-sizing: border-box;
      }
      .m-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .m-actions .btn-primary {
        flex: 1;
      }
      .m-actions .btn-ghost {
        flex: 1;
      }
      .error {
        margin-top: 12px;
        padding: 10px;
        background: #ffebee;
        color: #c62828;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 600;
      }
    `,
  ],
})
export class RaffleDetailComponent implements OnInit {
  raffle = signal<Raffle | null>(null);
  stats = signal<RaffleStats | null>(null);
  tickets = signal<Ticket[]>([]);
  filter = signal('');
  selected = signal<Ticket | null>(null);
  assignName = '';
  assignPhone = '';
  modalError = signal('');
  exporting = signal(false);
  drawOpen = signal(false);
  drawResult = signal<any>(null);
  drawSpinning = signal(false);

  private raffleId = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private modal: ModalService,
  ) {}

  ngOnInit() {
    this.raffleId = this.route.snapshot.paramMap.get('id') || '';
    this.reload();
  }

  reload() {
    if (!this.raffleId) return;
    this.api.getRaffle(this.raffleId).subscribe((r) => this.raffle.set(r));
    this.api.getStats(this.raffleId).subscribe((s) => this.stats.set(s));
    this.api.listTickets(this.raffleId).subscribe((t) => this.tickets.set(t));
  }

  filtered() {
    const f = this.filter();
    return f ? this.tickets().filter((t) => t.status === f) : this.tickets();
  }

  statusLabel(s: string) {
    return (
      {
        free: 'Libre',
        delivered: 'Entregado',
        registered: 'Registrado',
        scratched: 'Raspado',
        paid: 'Pagado',
        released: 'Liberado',
        open: 'Abierto',
        closed: 'Cerrado',
        drawn: 'Sorteado',
        draft: 'Borrador',
      }[s] || s
    );
  }

  openAssign(t: Ticket) {
    this.selected.set(t);
    this.assignName = t.participant?.name || '';
    this.assignPhone = t.participant?.phone || '';
    this.modalError.set('');
  }

  confirmAssign() {
    const t = this.selected();
    if (!t) return;
    this.api
      .assignTicket(this.raffleId, t.folio, {
        name: this.assignName || undefined,
        phone: this.assignPhone || undefined,
      })
      .subscribe({
        next: () => {
          this.selected.set(null);
          this.toast.success(
            `Folio ${t.folio} entregado`,
            `Código ${t.access_code} — compártelo solo con el participante`,
          );
          this.reload();
        },
        error: (err) => {
          this.toast.error(
            'No se pudo entregar',
            typeof err?.error?.detail === 'string' ? err.error.detail : 'Verifica los datos',
          );
        },
      });
  }

  async pay(t: Ticket) {
    const note = await this.modal.prompt({
      title: `Cobrar folio ${t.folio}`,
      message: `Confirma el pago de ${t.participant?.name || 'este participante'}.\nMonto: $${t.amount}`,
      label: 'Nota de pago (opcional)',
      placeholder: 'transferencia / efectivo / CoDi…',
      confirmLabel: 'Marcar como pagado',
      required: false,
    });
    this.api.markPaid(this.raffleId, t.folio, note || undefined).subscribe({
      next: () => {
        this.toast.success('Pago registrado', `Folio ${t.folio} marcado como pagado ✅`);
        this.reload();
      },
      error: (err) =>
        this.toast.error('Error al cobrar', err?.error?.detail || 'Intenta de nuevo'),
    });
  }

  async release(t: Ticket) {
    const ok = await this.modal.confirm({
      title: `¿Liberar folio ${t.folio}?`,
      message:
        'Se liberará el boleto y se generará un código nuevo. ' +
        'Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, liberar',
      cancelLabel: 'No, volver',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.releaseTicket(this.raffleId, t.folio).subscribe({
      next: () => {
        this.toast.info('Boleto liberado', `Folio ${t.folio} ya está disponible con código nuevo`);
        this.reload();
      },
      error: (err) =>
        this.toast.error('Error al liberar', err?.error?.detail || 'Intenta de nuevo'),
    });
  }

  copyLink(t: Ticket) {
    const slug = this.raffle()?.slug || '';
    const url = `${location.origin}/jugar/${slug}?folio=${t.folio}&cod=${t.access_code}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toast.success(
        `Enlace copiado — folio ${t.folio}`,
        'Mándalo solo a esa persona. Contiene su código de acceso.',
      );
    });
  }

  sendWhatsApp(t: Ticket) {
    const r = this.raffle();
    const slug = r?.slug || '';
    const url = location.origin + '/jugar/' + slug + '?folio=' + t.folio + '&cod=' + t.access_code;
    const nombre = t.participant?.name || '';
    const primerNombre = nombre ? nombre.split(' ')[0] : '';
    const saludo = primerNombre ? 'Hola ' + primerNombre + '! ' : 'Hola! ';
    const tel = (t.participant?.phone || '').replace(/\D/g, '');
    let mensaje = '';
    let waUrl = '';

    if (t.status === 'free') {
      mensaje = saludo +
        '\u{1F39F}\uFE0F Te aparte un boleto de la rifa *' + (r?.title || 'Natura') + '*.\n\n' +
        '\u{1F4CC} Folio: *' + t.folio + '*\n' +
        '\u{1F511} Codigo de acceso: *' + t.access_code + '*\n' +
        '\u{1F381} Premio: ' + (r?.prize || '') + '\n\n' +
        'Entra aqui para registrarte y raspar tu precio \u{1F447}\n' + url + '\n\n' +
        'Tu precio puede ir de $' + (r?.price_min || 30) + ' a $' + (r?.price_max || 50) + '.\n' +
        '\u{1F340} Suerte!';
    } else if (t.status === 'paid') {
      mensaje = saludo +
        '\u2705 Tu pago del folio *' + t.folio + '* ya quedo confirmado!\n\n' +
        '\u{1F4B0} Monto: $' + t.amount + '\n' +
        '\u{1F381} Premio: ' + (r?.prize || '') + '\n\n' +
        'El sorteo es el ' + (r?.draw_date || '(fecha por confirmar)') + ' \u{1F340} Suerte!';
    } else {
      mensaje = saludo +
        '\u{1F39F}\uFE0F Recordatorio de tu boleto de *' + (r?.title || 'Natura') + '*.\n\n' +
        '\u{1F4CC} Folio: *' + t.folio + '*\n' +
        '\u{1F511} Codigo: *' + t.access_code + '*\n\n' +
        'Entra aqui para raspar tu precio \u{1F447}\n' + url + '\n\n' +
        'Si ya raspaste, recuerda pagar para asegurar tu lugar. \u{1F340} Suerte!';
    }

    waUrl = tel
      ? 'https://wa.me/52' + tel + '?text=' + encodeURIComponent(mensaje)
      : 'https://wa.me/?text=' + encodeURIComponent(mensaje);

    window.open(waUrl, '_blank');
    this.toast.info(
      'WhatsApp abierto - folio ' + t.folio,
      tel ? 'Mensaje listo para ' + (t.participant?.name || 'el participante') : 'Elige el contacto',
    );
  }

  async closeRaffle() {
    const ok = await this.modal.confirm({
      title: '¿Cerrar la venta?',
      message:
        'Ya no se podrán entregar más boletos. ' +
        'Puedes seguir cobrando los que ya están entregados.',
      confirmLabel: 'Cerrar venta',
      cancelLabel: 'Seguir vendiendo',
    });
    if (!ok) return;
    this.api.closeRaffle(this.raffleId).subscribe({
      next: () => {
        this.toast.success('Venta cerrada', 'Ya no se entregarán más boletos');
        this.reload();
      },
      error: (err) =>
        this.toast.error('Error al cerrar', err?.error?.detail || 'Intenta de nuevo'),
    });
  }

  async draw() {
    const s = this.stats();
    if (!s || s.paid === 0) {
      this.toast.warning(
        'No hay boletos pagados',
        'Necesitas al menos un boleto pagado para poder sortear.',
      );
      return;
    }
    const ok = await this.modal.confirm({
      title: '🎲 Sortear el premio',
      message: `Se sorteará entre ${s.paid} boleto(s) pagado(s).\n\nEsta acción NO se puede deshacer y el resultado quedará registrado.`,
      confirmLabel: 'Sortear ahora',
      cancelLabel: 'Cancelar',
      variant: 'primary',
    });
    if (!ok) return;
    this.drawOpen.set(true);
    this.drawResult.set(null);
    this.drawSpinning.set(true);

    setTimeout(() => {
      this.api.draw(this.raffleId).subscribe({
        next: (res) => {
          this.drawSpinning.set(false);
          this.drawResult.set(res.winner);
          this.lanzarConfettiSorteo();
          this.toast.success('🏆 ¡Tenemos ganador!', `Folio ${res.winner.folio} — ${res.winner.participant?.name || 'Ganador'}`);
          this.reload();
        },
        error: (err) => {
          this.drawSpinning.set(false);
          this.drawOpen.set(false);
          this.toast.error('Error al sortear', err?.error?.detail || 'Intenta de nuevo');
        },
      });
    }, 3000);
  }

  lanzarConfettiSorteo() {
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      const colors = ['#c9a227','#4caf50','#1b5e20','#ff7043','#fff176','#fff'];
      el.style.cssText = `position:fixed;width:${6+Math.random()*10}px;height:${6+Math.random()*10}px;top:-14px;left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'2px'};z-index:99999;pointer-events:none;animation:sc-fall ${2+Math.random()*1.5}s linear ${Math.random()*0.8}s forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }
    if (!document.getElementById('sc-keyframes')) {
      const st = document.createElement('style');
      st.id = 'sc-keyframes';
      st.textContent = '@keyframes sc-fall { 0% { opacity:1; transform:translateY(0) rotate(0deg); } 100% { opacity:0; transform:translateY(105vh) rotate(720deg); } }';
      document.head.appendChild(st);
    }
  }

  exportExcel() {
    this.exporting.set(true);
    this.api.exportParticipants(this.raffleId).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const slug = this.raffle()?.slug || 'sorteo';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participantes-${slug}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Excel descargado', `participantes-${slug}.xlsx`);
      },
      error: (err) => {
        this.exporting.set(false);
        this.toast.error(
          'Error al exportar',
          err?.error?.detail || 'No se pudo generar el archivo',
        );
      },
    });
  }

  editRaffle() {
    const r = this.raffle();
    if (!r) return;
    this.editTitle = r.title;
    this.editPrize = r.prize;
    this.editPrizeValue = r.prize_value;
    this.editDrawDate = r.draw_date || '';
    this.editNotes = r.notes || '';
    this.editImageUrl = (r as any).image_url || '';
    this.editMeetUrl = (r as any).meet_url || '';
    this.editMaxTickets = (r as any).max_tickets_per_person ?? 3;
    this.editOpen.set(true);
  }

  editOpen = signal(false);
  editTitle = '';
  editPrize = '';
  editPrizeValue = 0;
  editDrawDate = '';
  editNotes = '';
  editImageUrl = '';
  editMeetUrl = '';
  editMaxTickets = 3;
  editSaving = signal(false);

  onPhotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Imagen muy grande', 'Máximo 5 MB');
      return;
    }
    this.editSaving.set(true);
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.editImageUrl = res.url;
        this.editSaving.set(false);
        this.toast.success('Foto subida', 'Imagen guardada en Cloudinary');
      },
      error: (err) => {
        this.editSaving.set(false);
        this.toast.error('Error al subir', err?.error?.detail || 'No se pudo subir la imagen');
      },
    });
  }

  saveEdit() {
    const body: any = {
      title: this.editTitle,
      prize: this.editPrize,
      prize_value: this.editPrizeValue,
      draw_date: this.editDrawDate || null,
      notes: this.editNotes || null,
      image_url: this.editImageUrl || null,
      meet_url: this.editMeetUrl || null,
      max_tickets_per_person: this.editMaxTickets,
    };
    this.editSaving.set(true);
    this.api.updateRaffle(this.raffleId, body).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.editOpen.set(false);
        this.toast.success('Sorteo actualizado', 'Todos los cambios guardados');
        this.reload();
      },
      error: (err) => {
        this.editSaving.set(false);
        this.toast.error('Error', err?.error?.detail || 'No se pudo actualizar');
      },
    });
  }

  exportBackup() {
    this.api.exportBackup(this.raffleId).subscribe({
      next: (blob) => {
        const slug = this.raffle()?.slug || 'sorteo';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup-' + slug + '.json';
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('Backup descargado', 'backup-' + slug + '.json');
      },
      error: (err) => this.toast.error('Error', err?.error?.detail || 'No se pudo generar el backup'),
    });
  }

  landingUrl(): string {
    return location.origin + '/sorteo/' + (this.raffle()?.slug || '');
  }

  copyLandingLink() {
    navigator.clipboard.writeText(this.landingUrl()).then(() => {
      this.toast.success('Enlace de landing copiado', 'Ideal para presentar el sorteo');
    });
  }

  sendReminder(t: Ticket) {
    const r = this.raffle();
    const nombre = t.participant?.name || '';
    const p = nombre ? nombre.split(' ')[0] : '';
    const msg =
      (p ? 'Hola ' + p + '! ' : 'Hola! ') +
      'Recordatorio: tu boleto *folio ' + t.folio + '* de la rifa *' + (r?.title || '') + '* ' +
      'aun no esta pagado.\n\n' +
      'Monto: *$' + t.amount + '*\n' +
      'Para asegurar tu lugar en el sorteo, realiza tu pago.\n\n' +
      'Cualquier duda, escribeme. Suerte!';
    const tel = (t.participant?.phone || '').replace(/\D/g, '');
    const waUrl = tel ? 'https://wa.me/52' + tel + '?text=' + encodeURIComponent(msg) : 'https://wa.me/?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank');
    this.toast.info('Recordatorio abierto', 'Folio ' + t.folio);
  }

  qrOpen = signal(false);

  async deleteRaffle() {
    const ok = await this.modal.confirm({
      title: '🗑️ Eliminar sorteo',
      message: 'Se eliminará el sorteo y TODOS sus boletos. Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar todo',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.deleteRaffle(this.raffleId).subscribe({
      next: (res) => {
        this.toast.success('Sorteo eliminado', `${res.deleted_raffle} — ${res.deleted_tickets} boletos borrados`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => this.toast.error('Error', err?.error?.detail || 'No se pudo eliminar'),
    });
  }

  showQR() {
    this.qrOpen.set(true);
  }

  getQRUrl(): string {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(this.boardUrl());
  }

  boardUrl(): string {
    return location.origin + '/sorteo/' + (this.raffle()?.slug || '') + '/tablero';
  }

  copyBoardLink() {
    navigator.clipboard.writeText(this.boardUrl()).then(() => {
      this.toast.success('Enlace copiado', 'Compartelo con tus participantes');
    });
  }

  shareBoardWhatsApp() {
    const r = this.raffle();
    const msg =
      '\u{1F39F}\uFE0F ' + (r?.title || 'Sorteo Natura') + '\n\n' +
      '\u{1F381} Premio: ' + (r?.prize || '') + '\n' +
      '\u{1F4B0} Tu precio lo descubres al raspar: $' + (r?.price_min || 30) + ' a $' + (r?.price_max || 50) + '\n\n' +
      'Elige tu boleto aqui \u{1F447}\n' + this.boardUrl() + '\n\n' +
      '\u{1F340} Suerte!';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    this.toast.info('WhatsApp abierto', 'Elige el contacto o grupo');
  }

  copyCode(t: Ticket) {
    navigator.clipboard.writeText(t.access_code).then(() => {
      this.toast.success('Código copiado', 'Folio ' + t.folio + ': ' + t.access_code);
    });
  }
}
