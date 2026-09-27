import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { PublicRaffle } from '../../core/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing">
      <!-- HERO -->
      <section class="hero">
        <div class="hero-inner">
          <div class="brand">🎟️ Sorteo Natura</div>
          @if (raffle(); as r) {
            <h1>{{ r.title }}</h1>
            <p class="tagline">Un premio increíble, un raspadito de emoción</p>

            <div class="prize-card">
              <div class="prize-icon">🎁</div>
              <div class="prize-name">{{ r.prize }}</div>
              <div class="prize-value">Valor: \${{ r.prize_value }} MXN</div>
            </div>

            <div class="stats-row">
              <div class="stat">
                <div class="stat-n">{{ r.ticket_count }}</div>
                <div class="stat-t">boletos</div>
              </div>
              <div class="stat">
                <div class="stat-n">\${{ r.price_min }}–\${{ r.price_max }}</div>
                <div class="stat-t">precio al raspar</div>
              </div>
              <div class="stat">
                <div class="stat-n">{{ r.paid_count }}</div>
                <div class="stat-t">ya participan</div>
              </div>
            </div>

            @if (r.drawn) {
              <div class="winner-banner">
                🏆 Ganó el folio <strong>{{ r.winner_folio }}</strong>
                — {{ r.winner_name || 'Ganador' }}
              </div>
            } @else {
              <button class="cta" (click)="goToBoard()">
                Ver boletos disponibles 🎟️
              </button>
              <p class="fine">Elige tu boleto, raspa y descubre tu precio.</p>
            }
          } @else {
            <h1>Raspadito digital</h1>
            <p class="tagline">Cargando sorteo…</p>
          }
        </div>
      </section>

      <!-- CÓMO FUNCIONA -->
      <section class="how">
        <h2>¿Cómo funciona?</h2>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-icon">🔐</div>
            <h3>Entra con tu folio</h3>
            <p>Recibes un folio y un código personal de la organizadora.</p>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-icon">✍️</div>
            <h3>Regístrate</h3>
            <p>Pon tu nombre y WhatsApp para controlar que cada folio se use una vez.</p>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-icon">👆</div>
            <h3>Raspa y descubre</h3>
            <p>Raspa con el dedo y descubre cuánto cuesta tu boleto: entre \${{ raffle()?.price_min || 30 }} y \${{ raffle()?.price_max || 50 }}.</p>
          </div>
          <div class="step">
            <div class="step-num">4</div>
            <div class="step-icon">🍀</div>
            <h3>Paga y participa</h3>
            <p>Paga tu monto y entras al sorteo del premio. ¡Suerte!</p>
          </div>
        </div>
      </section>

      <!-- ACCESO -->
      <section class="access" id="access">
        <h2>Ya tengo mi boleto</h2>
        <p class="access-sub">Ingresa tu folio y código de acceso para continuar</p>
        <div class="access-card">
          <div class="row2">
            <div>
              <label>Folio</label>
              <input type="number" [(ngModel)]="folio" placeholder="07" min="1" />
            </div>
            <div>
              <label>Código de acceso</label>
              <input [(ngModel)]="code" placeholder="A7K2" (keyup.enter)="goToPlay()" />
            </div>
          </div>
          <button class="cta" (click)="goToPlay()">
            Continuar al raspadito →
          </button>
          @if (error()) {
            <div class="error">{{ error() }}</div>
          }
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="foot">
        <p>Rifa privada · Solo con folio y código de acceso</p>
        <p>Pagues \${{ raffle()?.price_min || 30 }} o \${{ raffle()?.price_max || 50 }}, tu probabilidad de ganar es la misma 🍀</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .landing {
        min-height: 100vh;
        background: #faf7f0;
      }

      /* HERO */
      .hero {
        background: linear-gradient(155deg, #0d3b12 0%, #1b5e20 40%, #2e7d32 100%);
        color: #fff;
        padding: 52px 20px 60px;
        text-align: center;
      }
      .hero-inner {
        max-width: 560px;
        margin: 0 auto;
      }
      .brand {
        font-size: 12px;
        letter-spacing: 4px;
        text-transform: uppercase;
        opacity: 0.8;
        margin-bottom: 14px;
      }
      .hero h1 {
        font-size: 32px;
        font-weight: 900;
        margin: 0 0 8px;
        line-height: 1.15;
      }
      .tagline {
        font-size: 15px;
        opacity: 0.85;
        margin-bottom: 28px;
      }
      .prize-card {
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(8px);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 24px 20px;
        margin-bottom: 26px;
      }
      .prize-icon {
        font-size: 44px;
      }
      .prize-name {
        font-size: 20px;
        font-weight: 800;
        margin: 8px 0 4px;
      }
      .prize-value {
        font-size: 13px;
        opacity: 0.8;
      }
      .stats-row {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }
      .stat {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 14px 18px;
        min-width: 110px;
      }
      .stat-n {
        font-size: 20px;
        font-weight: 900;
      }
      .stat-t {
        font-size: 11px;
        opacity: 0.75;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }
      .cta {
        display: inline-block;
        padding: 16px 40px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #c9a227, #f0c94e);
        color: #1b5e20;
        font-size: 17px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 8px 28px rgba(201, 162, 39, 0.4);
        text-decoration: none;
        transition: transform 0.15s;
      }
      .cta:hover {
        transform: translateY(-2px);
      }
      .fine {
        font-size: 12px;
        opacity: 0.7;
        margin-top: 14px;
      }
      .winner-banner {
        background: rgba(255, 255, 255, 0.15);
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        border-radius: 16px;
        padding: 18px;
        font-size: 16px;
      }

      /* CÓMO FUNCIONA */
      .how {
        max-width: 720px;
        margin: 0 auto;
        padding: 48px 20px;
      }
      .how h2 {
        text-align: center;
        font-size: 24px;
        color: #1f2937;
        margin-bottom: 32px;
      }
      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px;
      }
      .step {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 18px;
        padding: 24px 18px;
        text-align: center;
        position: relative;
      }
      .step-num {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: 28px;
        background: #1b5e20;
        color: #fff;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .step-icon {
        font-size: 32px;
        margin: 8px 0 10px;
      }
      .step h3 {
        font-size: 15px;
        color: #1f2937;
        margin: 0 0 6px;
      }
      .step p {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
      }

      /* ACCESO */
      .access {
        background: linear-gradient(155deg, #1b5e20, #2e7d32);
        padding: 48px 20px 56px;
        text-align: center;
      }
      .access h2 {
        color: #fff;
        font-size: 24px;
        margin: 0 0 8px;
      }
      .access-sub {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin-bottom: 24px;
      }
      .access-card {
        max-width: 420px;
        margin: 0 auto;
        background: #faf7f0;
        border-radius: 20px;
        padding: 28px 24px;
        text-align: left;
      }
      .row2 {
        display: grid;
        grid-template-columns: 1fr 1.4fr;
        gap: 12px;
      }
      label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
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
      .access-card .cta {
        display: block;
        width: 100%;
        margin-top: 18px;
        text-align: center;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        box-shadow: 0 6px 20px rgba(27, 94, 32, 0.3);
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

      /* FOOTER */
      .foot {
        background: #0d3b12;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        padding: 28px 20px;
        font-size: 12px;
        line-height: 1.7;
      }

      @media (max-width: 480px) {
        .hero { padding: 36px 16px 44px; }
        .hero h1 { font-size: 22px; }
        .tagline { font-size: 13px; }
        .prize-card { padding: 18px 14px; }
        .prize-name { font-size: 17px; }
        .stats-row { gap: 8px; }
        .stat { min-width: 0; flex: 1; padding: 10px 8px; }
        .stat-n { font-size: 15px; }
        .stat-t { font-size: 9px; }
        .how { padding: 32px 16px; }
        .how h2 { font-size: 20px; }
        .steps { grid-template-columns: 1fr; }
        .access { padding: 36px 16px 44px; }
        .row2 { grid-template-columns: 1fr; }
        .access-card { padding: 20px 16px; }
      }
    `,
  ],
})
export class LandingComponent implements OnInit {
  raffle = signal<PublicRaffle | null>(null);
  folio = 1;
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
    this.api.publicRaffle(this.slug).subscribe({
      next: (r) => {
        this.raffle.set(r);
      },
      error: () => {
        this.error.set('Sorteo no encontrado');
        this.toast.error('Sorteo no encontrado', 'Verifica el enlace con la organizadora');
      },
    });
  }

  scrollToAccess() {
    document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToBoard() {
    this.router.navigate(['/sorteo', this.slug, 'tablero']);
  }

  goToPlay() {
    const f = +this.folio;
    if (!f || f < 1) {
      this.error.set('Escribe tu número de folio');
      return;
    }
    if (!this.code || this.code.trim().length < 3) {
      this.error.set('Escribe tu código de acceso');
      return;
    }
    this.error.set('');
    this.router.navigate(['/jugar', this.slug], {
      queryParams: { folio: f, cod: this.code.trim().toUpperCase() },
    });
  }
}
