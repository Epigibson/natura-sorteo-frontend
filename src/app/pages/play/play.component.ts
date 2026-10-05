import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ScratchCardComponent } from '../../core/scratch-card.component';
import { BankDataComponent } from '../../core/bank-data.component';
import { BANK_DATA } from '../../core/bank-data';
import { AccessCheck, PublicRaffle } from '../../core/models';

type Paso = 'acceso' | 'registro' | 'raspa' | 'resultado' | 'ganador' | 'error-acceso';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CommonModule, FormsModule, ScratchCardComponent, BankDataComponent],
  template: `
    <div class="play-wrap">
      <div class="card">
        <div class="head">
          <div class="brand">🎟️ Sorteo Natura</div>
          @if (raffle(); as r) {
            <h1>{{ r.title }}</h1>
            <p class="sub">🎁 {{ r.prize }}</p>
          } @else {
            <h1>Raspadito digital</h1>
          }
        </div>

        <!-- GANADOR -->
        @if (paso() === 'ganador') {
          <div class="body center">
            <div class="big">🏆</div>
            <h2>¡Sorteo realizado!</h2>
            @if (raffle(); as r) {
              <p>
                Ganó el folio <strong>{{ r.winner_folio }}</strong>
                — {{ r.winner_name || 'Ganador' }}
              </p>
            }
          </div>
        }

        <!-- ERROR ACCESO -->
        @if (paso() === 'error-acceso') {
          <div class="body center">
            <div class="big">🔐</div>
            <h2>Acceso denegado</h2>
            <p class="hint">{{ error() }}</p>
            <button class="btn-primary" (click)="goToBoard()">
              ← Volver al tablero
            </button>
            <button class="btn-link" (click)="paso.set('acceso')">
              Intentar con otro folio / código
            </button>
          </div>
        }

        <!-- ACCESO -->
        @if (paso() === 'acceso') {
          <div class="body">
            <p class="hint">
              Ingresa tu <strong>folio</strong> y <strong>código de acceso</strong>
              para descubrir el precio de tu boleto.
            </p>
            <div class="row2">
              <div>
                <label>Folio</label>
                <input type="number" [(ngModel)]="folio" placeholder="07" min="1" />
              </div>
              <div>
                <label>Código</label>
                <input [(ngModel)]="code" placeholder="A7K2" (keyup.enter)="checkAccess()" />
              </div>
            </div>
            <button class="btn-primary" (click)="checkAccess()" [disabled]="loading()">
              {{ loading() ? 'Verificando…' : 'Entrar 🔐' }}
            </button>
            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          </div>
        }

        <!-- REGISTRO -->
        @if (paso() === 'registro') {
          <div class="body">
            <p class="hint">
              Antes de raspar, registra tus datos. Así controlamos que cada folio
              se use una sola vez.
            </p>
            <label>Nombre completo</label>
            <input [(ngModel)]="name" placeholder="Ana García López" />
            <label>Número de WhatsApp / celular</label>
            <input [(ngModel)]="phone" placeholder="55 1234 5678" type="tel" />
            <button class="btn-primary" (click)="register()" [disabled]="loading()">
              {{ loading() ? 'Registrando…' : 'Registrarme y continuar ✅' }}
            </button>
            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          </div>
        }

        <!-- RASPA -->
        @if (paso() === 'raspa') {
          <div class="body center">
            <p class="hint">Hola <strong>{{ name.split(' ')[0] }}</strong> 👋</p>
            <p class="hint">Raspa con el dedo la zona plateada para descubrir tu precio.</p>

            <app-scratch-card
              [amount]="amount() || 0"
              [failed]="scratchFailed()"
              (revealed)="onScratchRevealed()"
              (retry)="onScratchRevealed()"
            />

            @if (revealed()) {
              <div class="pay-now">
                <app-bank-data />
              </div>
              <button class="btn-wa" (click)="sendWhatsApp()">
                📲 Enviar mis datos por WhatsApp
              </button>
            }
            @if (error()) {
              <div class="error">{{ error() }}</div>
            }
          </div>
        }

        <!-- RESULTADO -->
        @if (paso() === 'resultado') {
          <div class="body center">
            <div class="result-box">
              <div class="label">Tu boleto cuesta</div>
              <div class="amount-big">\${{ amount() }}</div>
              <p class="hint">
                Realiza tu pago con los datos de abajo para asegurar tu lugar
                en el sorteo.
              </p>
            </div>
            <app-bank-data />
            <button class="btn-wa" (click)="sendWhatsApp()">
              📲 Enviar mis datos por WhatsApp
            </button>
          </div>
        }
      </div>
      <div class="foot">
        Pagues {{ minPrice() }} o {{ maxPrice() }},
        tu probabilidad de ganar es la misma 🍀
      </div>
    </div>
  `,
  styles: [
    `
      .play-wrap {
        min-height: 100vh;
        background: linear-gradient(160deg, #0d3b12 0%, #1b5e20 45%, #2e7d32 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 14px;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #faf7f0;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      }
      .head {
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        padding: 20px;
        text-align: center;
      }
      .brand {
        font-size: 11px;
        letter-spacing: 3px;
        text-transform: uppercase;
        opacity: 0.85;
      }
      h1 {
        margin: 6px 0 4px;
        font-size: 20px;
      }
      .sub {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }
      .body {
        padding: 24px 20px 28px;
      }
      .center {
        text-align: center;
      }
      .hint {
        color: #6b7280;
        font-size: 13.5px;
        line-height: 1.5;
        margin: 0 0 14px;
      }
      .row2 {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
      }
      label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin: 12px 0 5px;
      }
      input {
        width: 100%;
        padding: 13px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 16px;
        outline: none;
        box-sizing: border-box;
      }
      input:focus {
        border-color: #4caf50;
      }
      .btn-primary {
        width: 100%;
        margin-top: 18px;
        padding: 14px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.45;
      }
      .btn-wa {
        width: 100%;
        margin-top: 10px;
        padding: 14px;
        border: none;
        border-radius: 14px;
        background: #25d366;
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      .error {
        margin-top: 14px;
        padding: 12px;
        background: #ffebee;
        color: #c62828;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
      }
      .result-box {
        background: linear-gradient(145deg, #fff8e1, #ffecb3);
        border-radius: 16px;
        padding: 28px 18px;
        margin-bottom: 16px;
      }
      .pay-now {
        margin: 16px 0 4px;
        text-align: left;
      }
      .result-box .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #8d6e00;
        font-weight: 700;
      }
      .amount-big {
        font-size: 56px;
        font-weight: 900;
        color: #1b5e20;
        margin: 6px 0 12px;
      }
      .big {
        font-size: 56px;
      }
      .btn-link {
        display: block;
        width: 100%;
        margin-top: 10px;
        padding: 12px;
        border: none;
        border-radius: 12px;
        background: transparent;
        color: #1b5e20;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
      }
      .foot {
        margin-top: 18px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        text-align: center;
        line-height: 1.5;
      }
      @media (max-width: 480px) {
        .play-wrap { padding: 12px 8px 30px; }
        .card { border-radius: 16px; }
        .body { padding: 18px 14px 22px; }
        .row2 { grid-template-columns: 1fr; }
        .result-box { padding: 20px 14px; }
        .amount-big { font-size: 44px; }
        h1 { font-size: 18px; }
      }
    `,
  ],
})
export class PlayComponent implements OnInit {
  slug = '';
  folio = 1;
  code = '';
  name = '';
  phone = '';
  amount = signal(0);
  revealed = signal(false);
  scratchFailed = signal(false);
  loading = signal(false);
  error = signal('');
  raffle = signal<PublicRaffle | null>(null);
  access = signal<AccessCheck | null>(null);
  paso = signal<Paso>('acceso');
  fromBoard = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    const qp = this.route.snapshot.queryParamMap;
    const f = qp.get('folio');
    const c = qp.get('cod') || qp.get('code');
    if (f) this.folio = +f;
    if (c) this.code = c;
    this.fromBoard = !!(f && c);

    this.api.publicRaffle(this.slug).subscribe({
      next: (r) => {
        this.raffle.set(r);
        if (r.drawn) {
          this.paso.set('ganador');
        } else if (this.fromBoard) {
          // Viene del tablero con folio+cod: auto-verificar, sin mostrar formulario
          this.checkAccess(true);
        }
        // Si NO viene con params, se queda en 'acceso' (formulario manual)
      },
      error: () => this.error.set('Sorteo no encontrado'),
    });
  }

  checkAccess(auto = false) {
    this.loading.set(true);
    this.error.set('');
    this.api
      .access({ folio: this.folio, code: this.code, raffle_slug: this.slug })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.access.set(res);
          this.name = res.participant_name || '';
          if (res.amount != null) {
            this.amount.set(res.amount);
            this.revealed.set(true);
            this.paso.set('resultado');
          } else if (res.needs_registration || !this.name) {
            this.paso.set('registro');
          } else {
            this.paso.set('raspa');
          }
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.detail || 'Acceso denegado';
          this.error.set(msg);
          if (this.fromBoard || auto) {
            // Si viene del tablero: pantalla de error con botón para volver
            this.paso.set('error-acceso');
          }
          // Si es manual (formulario), se queda en 'acceso' mostrando el error
        },
      });
  }

  goToBoard() {
    window.location.href = `/sorteo/${this.slug}/tablero`;
  }

  /** Ya NO precarga el monto — se obtiene solo después de raspar. */
  private precargarMonto() {
    // Intencionalmente vacío: el monto se descubre al raspar
  }

  register() {
    if (!this.name || this.name.trim().length < 3) {
      this.error.set('Escribe tu nombre completo');
      return;
    }
    const digits = (this.phone || '').replace(/\D/g, '');
    if (digits.length < 10) {
      this.error.set('Teléfono debe tener 10 dígitos');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api
      .register({
        folio: this.folio,
        code: this.code,
        raffle_slug: this.slug,
        name: this.name.trim(),
        phone: digits,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Registro exitoso', `¡Bienvenida, ${this.name.split(' ')[0]}!`);
          this.paso.set('raspa');
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.detail || 'Error de registro');
          this.toast.error('Error de registro', err?.error?.detail || 'Verifica tus datos');
        },
      });
  }

  /** Se dispara cuando el canvas se raspa lo suficiente. */
  onScratchRevealed() {
    this.revealed.set(true);
    this.scratchFailed.set(false);
    this.requestAmount(0);
  }

  /** Obtiene el monto SOLO después de raspar (anti-trampa). Reintenta ante fallos de red/servidor dormido. */
  private requestAmount(attempt: number) {
    this.api
      .scratch({ folio: this.folio, code: this.code, raffle_slug: this.slug })
      .subscribe({
        next: (res) => {
          this.amount.set(res.amount);
          this.toast.success('¡Boleto raspado!', `Tu precio es $${res.amount} 🎉`);
          setTimeout(() => this.paso.set('resultado'), 1100);
        },
        error: (err) => {
          const transient = err?.status === 0 || err?.status >= 500;
          if (transient && attempt < 2) {
            setTimeout(() => this.requestAmount(attempt + 1), 2500 * (attempt + 1));
            return;
          }
          this.scratchFailed.set(true);
          this.toast.error('No se pudo obtener el monto', err?.error?.detail || 'Revisa tu conexión y toca Reintentar');
        },
      });
  }

  sendWhatsApp() {
    const r = this.raffle();
    const texto =
      `🎟️ REGISTRO — ${r?.title || 'Sorteo Natura'}\n` +
      `Folio: ${this.folio}\n` +
      `Nombre: ${this.name}\n` +
      `Teléfono: ${this.phone}\n` +
      `Monto del boleto: $${this.amount()}\n` +
      `Estado: raspado (falta confirmar pago)\n\n` +
      `Datos para pago:\n` +
      `Beneficiario: ${BANK_DATA.beneficiary}\n` +
      `Cuenta: ${BANK_DATA.accountNumber}\n` +
      `CLABE: ${BANK_DATA.clabe}\n` +
      `Tarjeta: ${BANK_DATA.cardNumber}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  minPrice() {
    return '$' + (this.raffle()?.price_min ?? 30);
  }

  maxPrice() {
    return '$' + (this.raffle()?.price_max ?? 50);
  }
}
