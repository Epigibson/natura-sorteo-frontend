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
      <!-- HERO PREMIUM -->
      <section class="hero">
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="brand-badge">🎟️ SORTEO NATURA</div>
          @if (raffle(); as r) {
            <h1>{{ r.title }}</h1>
            <p class="tagline">Un premio increíble, un raspadito de emoción</p>

            <div class="prize-card">
              @if ($any(r).image_url) {
                <img class="prize-photo" [src]="$any(r).image_url" [alt]="r.prize" />
              } @else {
                <div class="prize-icon">🎁</div>
              }
              <div class="prize-name">{{ r.prize }}</div>
              <div class="prize-value">Valor: \${{ r.prize_value }} MXN</div>
              @if (r.draw_date) {
                <div class="draw-date">
                  📅 Sorteo: <strong>{{ formatDate(r.draw_date) }}</strong>
                </div>
              }
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
              <!-- SORTEO REALIZADO -->
              <div class="winner-hero">
                <div class="winner-confetti">🎉🏆🎉</div>
                <div class="winner-label">SORTEO REALIZADO</div>
                <div class="winner-name-big">{{ r.winner_name || 'Ganador' }}</div>
                <div class="winner-folio">Folio {{ r.winner_folio }}</div>
                <div class="winner-prize">se ganó: {{ r.prize }}</div>
              </div>
            } @else {
              <!-- CUENTA REGRESIVA -->
              @if (r.draw_date) {
                <div class="countdown">
                  <div class="cd-label">⏰ El sorteo es en</div>
                  <div class="cd-grid">
                    <div class="cd-box">
                      <div class="cd-n">{{ cdDays() }}</div>
                      <div class="cd-t">días</div>
                    </div>
                    <div class="cd-box">
                      <div class="cd-n">{{ cdHours() }}</div>
                      <div class="cd-t">hrs</div>
                    </div>
                    <div class="cd-box">
                      <div class="cd-n">{{ cdMins() }}</div>
                      <div class="cd-t">min</div>
                    </div>
                    <div class="cd-box">
                      <div class="cd-n">{{ cdSecs() }}</div>
                      <div class="cd-t">seg</div>
                    </div>
                  </div>
                  <div class="cd-date">📅 {{ formatDate(r.draw_date) }}</div>
                </div>
              }
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

      

      <!-- CTA FINAL -->
      @if (!raffle()?.drawn) {
        <section class="cta-section">
          <h2>¿Listo para raspar tu suerte?</h2>
          <p>Elige tu boleto y descubre cuánto pagas</p>
          <button class="cta-big" (click)="goToBoard()">Ver boletos disponibles 🎟️</button>
        </section>
      }

      <!-- FOOTER -->
      <footer class="foot">
        <div class="foot-brand">🎟️ Sorteo Natura</div>
        <p>Pagues \${{ raffle()?.price_min || 30 }} o \${{ raffle()?.price_max || 50 }}, tu probabilidad de ganar es la misma 🍀</p>
        <p>Rifa privada entre conocidos</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .landing {
        min-height: 100vh;
        background: #faf7f0;
        overflow-x: hidden;
      }

      /* HERO */
      .hero {
        background: linear-gradient(160deg, #071a08 0%, #0d3b12 25%, #1b5e20 50%, #2e7d32 75%, #1b5e20 100%);
        color: #fff;
        padding: 70px 20px 80px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 20% 50%, rgba(201,162,39,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(76,175,80,0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.1) 0%, transparent 40%);
        pointer-events: none;
      }
      .hero::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(to top, #faf7f0, transparent);
        pointer-events: none;
      }
      .hero-glow {
        position: absolute;
        top: -30%;
        left: 50%;
        transform: translateX(-50%);
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(201,162,39,0.25) 0%, rgba(201,162,39,0.05) 40%, transparent 70%);
        pointer-events: none;
        animation: pulse 4s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
        50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
      }
      .brand-badge {
        display: inline-block;
        font-size: 11px;
        letter-spacing: 4px;
        text-transform: uppercase;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        padding: 6px 18px;
        border-radius: 999px;
        margin-bottom: 18px;
      }
      .prize-photo {
        width: 140px;
        height: 140px;
        object-fit: cover;
        border-radius: 18px;
        border: 3px solid rgba(255,255,255,0.25);
        margin-bottom: 12px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.3);
      }
      .draw-date {
        margin-top: 10px;
        padding: 8px 16px;
        background: rgba(201,162,39,0.2);
        border: 1px solid rgba(201,162,39,0.3);
        border-radius: 999px;
        display: inline-block;
        font-size: 13px;
        color: #ffe082;
      }
      .draw-date strong { color: #fff; }
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
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        padding: 32px 24px;
        margin-bottom: 30px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 16px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .prize-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(from 0deg, transparent, rgba(201,162,39,0.1), transparent 30%);
        animation: shine 6s linear infinite;
        pointer-events: none;
      }
      @keyframes shine {
        to { transform: rotate(360deg); }
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
        gap: 14px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }
      .stat {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        padding: 18px 22px;
        min-width: 110px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .stat:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
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
      .cta, .cta-big {
        display: inline-block;
        padding: 18px 44px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #c9a227 0%, #f0c94e 50%, #c9a227 100%);
        background-size: 200% 200%;
        color: #1b5e20;
        font-size: 18px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(201, 162, 39, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        text-decoration: none;
        transition: all 0.25s;
        letter-spacing: 0.3px;
        animation: btnShine 3s ease-in-out infinite;
      }
      @keyframes btnShine {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .cta:hover, .cta-big:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 14px 40px rgba(201, 162, 39, 0.5), inset 0 1px 0 rgba(255,255,255,0.3);
      }
      .cta-big {
        padding: 20px 52px;
        font-size: 19px;
      }
      .fine {
        font-size: 12px;
        opacity: 0.7;
        margin-top: 14px;
      }
      .winner-hero {
        background: linear-gradient(135deg, rgba(201,162,39,0.25), rgba(255,215,0,0.15));
        border: 2px solid rgba(255,215,0,0.4);
        border-radius: 24px;
        padding: 32px 24px;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
      }
      .winner-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 0%, rgba(255,215,0,0.2) 0%, transparent 60%);
      }
      .winner-confetti { font-size: 32px; position: relative; }
      .winner-label {
        font-size: 12px; letter-spacing: 4px; text-transform: uppercase;
        color: #ffe082; font-weight: 800; margin: 8px 0; position: relative;
      }
      .winner-name-big {
        font-size: 28px; font-weight: 900; color: #fff;
        position: relative; text-shadow: 0 2px 12px rgba(0,0,0,0.3);
      }
      .winner-folio {
        font-size: 16px; color: #ffe082; font-weight: 700; margin: 4px 0; position: relative;
      }
      .winner-prize {
        font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 8px; position: relative;
      }

      .countdown {
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 22px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .cd-label {
        font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
        color: #ffe082; font-weight: 800; margin-bottom: 14px;
      }
      .cd-grid {
        display: flex; justify-content: center; gap: 12px; margin-bottom: 14px;
      }
      .cd-box {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 12px 16px;
        min-width: 64px;
        text-align: center;
      }
      .cd-n {
        font-size: 28px; font-weight: 900; color: #fff;
        font-variant-numeric: tabular-nums;
      }
      .cd-t {
        font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
        color: rgba(255,255,255,0.6); margin-top: 2px;
      }
      .cd-date {
        font-size: 13px; color: rgba(255,255,255,0.7);
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
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 28px 20px;
        text-align: center;
        position: relative;
        transition: all 0.25s;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      }
      .step:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        border-color: #c8e6c9;
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
      .cta-section {
        text-align: center;
        padding: 60px 20px;
        background: linear-gradient(135deg, #0d3b12, #1b5e20);
        color: #fff;
        position: relative;
        overflow: hidden;
      }
      .cta-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.2) 0%, transparent 60%);
        pointer-events: none;
      }
      .cta-section h2 {
        font-size: 28px;
        font-weight: 900;
        margin: 0 0 8px;
        position: relative;
      }
      .cta-section p {
        opacity: 0.8;
        margin: 0 0 28px;
        position: relative;
      }
      .foot {
        background: #071a08;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 36px 20px;
        font-size: 12px;
        line-height: 1.7;
      }
      .foot-brand {
        font-size: 14px;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
        letter-spacing: 2px;
      }

      @media (max-width: 480px) {
        .hero { padding: 36px 16px 44px; }
        .cd-grid { gap: 8px; }
        .cd-box { min-width: 52px; padding: 10px 8px; }
        .cd-n { font-size: 22px; }
        .winner-name-big { font-size: 22px; }
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
        if (!r.drawn && r.draw_date) {
          this.startCountdown(r.draw_date);
        }
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

  private cdInterval: any;
  private cdTarget = 0;
  cdDaysVal = signal('--');
  cdHoursVal = signal('--');
  cdMinsVal = signal('--');
  cdSecsVal = signal('--');

  cdDays() { return this.cdDaysVal(); }
  cdHours() { return this.cdHoursVal(); }
  cdMins() { return this.cdMinsVal(); }
  cdSecs() { return this.cdSecsVal(); }

  private startCountdown(dateStr: string) {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    this.cdTarget = new Date(+parts[0], +parts[1]-1, +parts[2], 12, 0, 0).getTime();
    if (this.cdInterval) clearInterval(this.cdInterval);
    const tick = () => {
      const now = Date.now();
      const diff = this.cdTarget - now;
      if (diff <= 0) {
        this.cdDaysVal.set('00');
        this.cdHoursVal.set('00');
        this.cdMinsVal.set('00');
        this.cdSecsVal.set('00');
        clearInterval(this.cdInterval);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.cdDaysVal.set(d < 10 ? '0'+d : String(d));
      this.cdHoursVal.set(h < 10 ? '0'+h : String(h));
      this.cdMinsVal.set(m < 10 ? '0'+m : String(m));
      this.cdSecsVal.set(s < 10 ? '0'+s : String(s));
    };
    tick();
    this.cdInterval = setInterval(tick, 1000);
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const dt = new Date(d + 'T12:00:00');
      return dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
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
