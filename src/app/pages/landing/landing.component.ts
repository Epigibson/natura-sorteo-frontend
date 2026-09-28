import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { PublicRaffle } from '../../core/models';
import { Hero3DComponent } from '../../core/hero-3d.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, Hero3DComponent],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-overlay"></div>
        <app-hero-3d [particleCount]="180" />
      </div>

      <nav class="nav">
        <div class="nav-brand">🎟️ SORTEO NATURA</div>
      </nav>

      <div class="hero-content">
        @if (raffle(); as r) {
          <div class="hero-badge">
            <span class="badge-dot"></span>
            @if (r.drawn) {
              SORTEO REALIZADO
            } @else {
              INSCRIPCIONES ABIERTAS
            }
          </div>

          <h1 class="hero-title">
            {{ r.title }}
          </h1>
          <p class="hero-prize-label">🏆 Gánate el</p>
          <p class="hero-prize-name">{{ r.prize }}</p>

          <p class="hero-sub">
            Un raspadito, un boleto, una oportunidad de ganar.
            <br>El precio lo descubres tú.
          </p>

          <!-- PREMIUM CARD -->
          <div class="prize-card">
            <div class="pc-glow"></div>
            <div class="pc-inner">
              @if ($any(r).image_url) {
                <div class="pc-image-wrap">
                  <img class="pc-image" [src]="$any(r).image_url" [alt]="r.prize" />
                  <div class="pc-image-shine"></div>
                </div>
              } @else {
                <div class="pc-icon">🎁</div>
              }
              <div class="pc-info">
                <div class="pc-label">PREMIO</div>
                <div class="pc-name">{{ r.prize }}</div>
                <div class="pc-value">Valor: \${{ r.prize_value }} MXN</div>
              </div>
            </div>
          </div>

          <!-- STATS -->
          <div class="hero-stats">
            <div class="hs">
              <div class="hs-icon">🎟️</div>
              <div class="hs-n">{{ r.ticket_count }}</div>
              <div class="hs-t">boletos</div>
            </div>
            <div class="hs-divider"></div>
            <div class="hs">
              <div class="hs-icon">💰</div>
              <div class="hs-n">\${{ r.price_min }}–\${{ r.price_max }}</div>
              <div class="hs-t">al raspar</div>
            </div>
            <div class="hs-divider"></div>
            <div class="hs">
              <div class="hs-icon">👥</div>
              <div class="hs-n">{{ r.paid_count }}</div>
              <div class="hs-t">participan</div>
            </div>
          </div>

          <!-- CTA -->
          @if (r.drawn) {
            <div class="winner-hero">
              <div class="wh-icon">🏆</div>
              <div class="wh-label">GANADOR</div>
              <div class="wh-name">{{ r.winner_name || 'Ganador' }}</div>
              <div class="wh-folio">Folio {{ r.winner_folio }}</div>
            </div>
          } @else {
            @if ($any(r).meet_url && !r.drawn) {
              <div class="meet-banner">
                <div class="meet-icon">🎥</div>
                <div class="meet-info">
                  <div class="meet-label">VIDEOCALL DEL SORTEO</div>
                  <div class="meet-text">Entra y vive el sorteo en vivo</div>
                </div>
                <a class="meet-btn" [href]="$any(r).meet_url" target="_blank">Entrar →</a>
              </div>
            }

            @if (r.draw_date) {
              <div class="countdown">
                <div class="cd-label">⏰ El sorteo es en</div>
                <div class="cd-grid">
                  <div class="cd-box">
                    <div class="cd-n">{{ cdDaysVal() }}</div>
                    <div class="cd-t">días</div>
                  </div>
                  <div class="cd-box">
                    <div class="cd-n">{{ cdHoursVal() }}</div>
                    <div class="cd-t">hrs</div>
                  </div>
                  <div class="cd-box">
                    <div class="cd-n">{{ cdMinsVal() }}</div>
                    <div class="cd-t">min</div>
                  </div>
                  <div class="cd-box">
                    <div class="cd-n">{{ cdSecsVal() }}</div>
                    <div class="cd-t">seg</div>
                  </div>
                </div>
                <div class="cd-date">📅 {{ formatDate(r.draw_date) }}</div>
              </div>
            }
            <button class="cta-main" (click)="goToBoard()">
              <span class="cta-text">Elegir mi boleto</span>
              <span class="cta-arrow">→</span>
            </button>
            <p class="cta-note">Solo {{ raffle()?.ticket_count }} boletos · Precio al raspar · Todos ganan oportunidad</p>
          }
        } @else {
          <div class="loading-hero">
            <div class="spinner-big"></div>
            <p>Cargando sorteo…</p>
          </div>
        }
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section section-how">
      <div class="how-bg">
        <div class="orb orb-5"></div>
      </div>
      <div class="section-header">
        <div class="sh-badge">¿CÓMO FUNCIONA?</div>
        <h2 class="sh-title">Tres pasos y estás dentro</h2>
        <p class="sh-sub">Rápido, fácil y sin complicaciones</p>
      </div>

      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">01</div>
          <div class="step-icon-wrap">
            <div class="step-icon">👆</div>
          </div>
          <h3>Elige tu boleto</h3>
          <p>Entra al tablero y selecciona los boletos que quieras. Cada uno esconde un precio diferente.</p>
          <div class="step-glow"></div>
        </div>

        <div class="step-connector">
          <div class="sc-line"></div>
          <div class="sc-dot"></div>
          <div class="sc-dot"></div>
          <div class="sc-dot"></div>
        </div>

        <div class="step-card step-featured">
          <div class="step-badge">MÁS POPULAR</div>
          <div class="step-num">02</div>
          <div class="step-icon-wrap step-icon-gold">
            <div class="step-icon">✨</div>
          </div>
          <h3>Raspa y descubre</h3>
          <p>Desliza el dedo sobre el raspadito digital y descubre cuánto cuesta tu boleto.</p>
          <div class="step-glow"></div>
        </div>

        <div class="step-connector">
          <div class="sc-line"></div>
          <div class="sc-dot"></div>
          <div class="sc-dot"></div>
          <div class="sc-dot"></div>
        </div>

        <div class="step-card">
          <div class="step-num">03</div>
          <div class="step-icon-wrap">
            <div class="step-icon">🏆</div>
          </div>
          <h3>Paga y participa</h3>
          <p>Realiza tu pago y entras al sorteo del premio. ¡Todos tienen la misma probabilidad!</p>
          <div class="step-glow"></div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section section-dark">
      <div class="section-header">
        <div class="sh-badge sh-badge-gold">¿POR QUÉ PARTICIPAR?</div>
        <h2 class="sh-title">Una forma divertida de ganar</h2>
      </div>

      <div class="features-grid">
        <div class="feature-card fc-glow">
          <div class="fc-icon-wrap fc-gold">
            <div class="fc-icon">🎲</div>
          </div>
          <h4>El precio lo eliges tú</h4>
          <p>Cada boleto tiene un precio entre \${{ raffle()?.price_min }} y \${{ raffle()?.price_max }}. Lo descubres al raspar.</p>
          <div class="fc-shine"></div>
        </div>
        <div class="feature-card fc-glow">
          <div class="fc-icon-wrap fc-green">
            <div class="fc-icon">⚖️</div>
          </div>
          <h4>Misma probabilidad</h4>
          <p>Pagues \${{ raffle()?.price_min }} o \${{ raffle()?.price_max }}, todos tienen la misma oportunidad de ganar.</p>
          <div class="fc-shine"></div>
        </div>
        <div class="feature-card fc-glow">
          <div class="fc-icon-wrap fc-blue">
            <div class="fc-icon">🔒</div>
          </div>
          <h4>100% transparente</h4>
          <p>Sorteo en vivo y resultado registrado. Todo verificable y sin trucos.</p>
          <div class="fc-shine"></div>
        </div>
        <div class="feature-card fc-glow">
          <div class="fc-icon-wrap fc-purple">
            <div class="fc-icon">⚡</div>
          </div>
          <h4>Rápido y fácil</h4>
          <p>Elige, raspa y paga en minutos. Todo desde tu celular.</p>
          <div class="fc-shine"></div>
        </div>
      </div>
    </section>

    <!-- STATS BAR -->
    <section class="stats-bar">
      <div class="sb-inner">
        <div class="sb-item">
          <div class="sb-n">21</div>
          <div class="sb-t">Boletos disponibles</div>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-item">
          <div class="sb-n">\${{ raffle()?.price_min }}–\${{ raffle()?.price_max }}</div>
          <div class="sb-t">Precio al raspar</div>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-item">
          <div class="sb-n">1</div>
          <div class="sb-t">Gran premio</div>
        </div>
        <div class="sb-divider"></div>
        <div class="sb-item">
          <div class="sb-n">∞</div>
          <div class="sb-t">Diversión</div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-section">
      <div class="cta-bg">
        <div class="orb orb-4"></div>
        <div class="grid-overlay"></div>
      </div>
      <div class="cta-content">
        @if (!raffle()?.drawn) {
          <div class="sh-badge sh-badge-gold">ÚLTIMA OPORTUNIDAD</div>
          <h2>¿Listo para raspar tu suerte?</h2>
          <p>Los boletos son limitados. Elige el tuyo ahora y participa por el premio.</p>
          <button class="cta-main cta-large" (click)="goToBoard()">
            <span class="cta-text">Ver boletos disponibles</span>
            <span class="cta-arrow">→</span>
          </button>
          <div class="cta-guarantee">
            <span>🔒 Compra segura</span>
            <span>⚡ Instantáneo</span>
            <span>🏆 100% transparente</span>
          </div>
        } @else {
          <div class="sh-badge sh-badge-gold">SORTEO REALIZADO</div>
          <h2>¡Gracias por participar!</h2>
          <p>El premio ya tiene dueño. ¡Hasta la próxima!</p>
        }
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">🎟️ SORTEO NATURA</div>
        <div class="footer-links">
          <span>Sorteo privado</span>
          <span class="footer-dot">·</span>
          <span>Entre conocidos</span>
          <span class="footer-dot">·</span>
          <span>100% transparente</span>
        </div>
        <p class="footer-copy">Todos los derechos reservados</p>
      </div>
    </footer>
  `,
  styles: [`
    /* RESET */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* FONT */
    :host {
      display: block;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a2e;
      overflow-x: hidden;
    }

    /* ===== HERO ===== */
    .hero {
      min-height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(165deg, #050a15 0%, #0a1628 30%, #0d2137 60%, #0a1628 100%);
      z-index: 0;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      animation: orbFloat 8s ease-in-out infinite;
    }
    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(201,162,39,0.25), transparent 70%);
      top: -10%; right: -10%;
      animation-delay: 0s;
    }
    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(27,94,32,0.3), transparent 70%);
      bottom: 10%; left: -10%;
      animation-delay: -3s;
    }
    .orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(201,162,39,0.15), transparent 70%);
      top: 40%; left: 30%;
      animation-delay: -5s;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(20px, -30px) scale(1.05); }
      66% { transform: translate(-15px, 20px) scale(0.95); }
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(201,162,39,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201,162,39,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .nav {
      position: relative;
      z-index: 2;
      padding: 24px 28px;
      display: flex;
      justify-content: center;
    }
    .nav-brand {
      font-size: 13px;
      letter-spacing: 4px;
      color: rgba(255,255,255,0.7);
      font-weight: 700;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 20px 60px;
      text-align: center;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(201,162,39,0.15);
      border: 1px solid rgba(201,162,39,0.25);
      padding: 8px 20px;
      border-radius: 999px;
      color: #c9a227;
      font-size: 11px;
      letter-spacing: 3px;
      font-weight: 800;
      margin-bottom: 28px;
    }
    .badge-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #4caf50;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .hero-title {
      font-size: clamp(28px, 5vw, 48px);
      font-weight: 900;
      color: #fff;
      line-height: 1.15;
      margin-bottom: 8px;
      max-width: 700px;
    }
    .hero-prize-label {
      font-size: 14px;
      color: rgba(201,162,39,0.8);
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .hero-prize-name {
      font-size: clamp(22px, 4vw, 36px);
      font-weight: 800;
      background: linear-gradient(135deg, #c9a227, #f0c94e, #c9a227);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s ease-in-out infinite;
      margin-bottom: 18px;
      max-width: 700px;
    }
    .title-highlight {
      background: linear-gradient(135deg, #c9a227, #f0c94e, #c9a227);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .hero-sub {
      font-size: clamp(15px, 2.5vw, 18px);
      color: rgba(255,255,255,0.7);
      line-height: 1.6;
      margin-bottom: 36px;
      max-width: 500px;
    }

    /* PRIZE CARD */
    .prize-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      margin-bottom: 32px;
    }
    .pc-glow {
      position: absolute;
      inset: -2px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(201,162,39,0.5), rgba(76,175,80,0.3), rgba(201,162,39,0.5));
      opacity: 0.6;
      animation: glowPulse 3s ease-in-out infinite;
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }
    .pc-inner {
      position: relative;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 22px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .pc-image-wrap {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 16px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .pc-image {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .pc-image-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      animation: shine 3s ease-in-out infinite;
    }
    @keyframes shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .pc-icon {
      font-size: 56px;
      flex-shrink: 0;
    }
    .pc-info { text-align: left; }
    .pc-label {
      font-size: 10px;
      letter-spacing: 3px;
      color: rgba(201,162,39,0.8);
      font-weight: 800;
      margin-bottom: 4px;
    }
    .pc-name {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .pc-value {
      font-size: 13px;
      color: rgba(255,255,255,0.6);
    }

    /* STATS */
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 36px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .hs {
      text-align: center;
    }
    .hs-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .hs-n {
      font-size: 22px;
      font-weight: 900;
      color: #fff;
    }
    .hs-t {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .hs-divider {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.1);
    }

    /* COUNTDOWN */
    .meet-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(201,162,39,0.2);
      border-radius: 18px;
      padding: 18px 20px;
      margin-bottom: 20px;
      width: 100%;
      max-width: 440px;
    }
    .meet-icon {
      font-size: 28px;
      flex-shrink: 0;
    }
    .meet-info {
      flex: 1;
      text-align: left;
    }
    .meet-label {
      font-size: 10px;
      letter-spacing: 2px;
      color: #f0c94e;
      font-weight: 800;
    }
    .meet-text {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
      margin-top: 2px;
    }
    .meet-btn {
      padding: 10px 18px;
      background: linear-gradient(135deg, #c9a227, #f0c94e);
      color: #1a1a2e;
      border: none;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13px;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s;
      font-family: inherit;
    }
    .meet-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(201,162,39,0.35);
    }

    .draw-live {
      background: rgba(201,162,39,0.1);
      border: 2px solid rgba(201,162,39,0.3);
      border-radius: 24px;
      padding: 36px 28px;
      margin-bottom: 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .draw-live::before {
      content: '';
      position: absolute;
      inset: 0;
      background: conic-gradient(from 0deg, transparent, rgba(201,162,39,0.1), transparent 30%);
      animation: drawSpin 3s linear infinite;
      pointer-events: none;
    }
    @keyframes drawSpin {
      to { transform: rotate(360deg); }
    }
    .draw-spinner-big {
      font-size: 56px;
      animation: drawPulse 0.6s ease-in-out infinite alternate;
      position: relative;
    }
    @keyframes drawPulse {
      from { transform: scale(1) rotate(-5deg); }
      to { transform: scale(1.15) rotate(5deg); }
    }
    .draw-live h2 {
      font-size: 24px;
      font-weight: 900;
      color: #fff;
      margin: 12px 0 6px;
      position: relative;
    }
    .draw-live p {
      color: rgba(255,255,255,0.6);
      margin-bottom: 20px;
      position: relative;
    }
    .draw-bar {
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 16px;
      position: relative;
    }
    .draw-fill {
      height: 100%;
      background: linear-gradient(90deg, #c9a227, #f0c94e);
      border-radius: 999px;
      animation: drawFill 4s ease-in-out infinite;
    }
    @keyframes drawFill {
      0% { width: 0%; }
      50% { width: 80%; }
      100% { width: 100%; }
    }
    .draw-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      position: relative;
    }
    .dd {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #c9a227;
      animation: ddPulse 1.2s ease-in-out infinite;
    }
    .dd:nth-child(2) { animation-delay: 0.2s; }
    .dd:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ddPulse {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    .countdown {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 22px 28px;
      margin-bottom: 28px;
    }
    .cd-label {
      font-size: 11px;
      letter-spacing: 3px;
      color: rgba(201,162,39,0.8);
      font-weight: 800;
      margin-bottom: 14px;
    }
    .cd-grid {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .cd-box {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 12px 16px;
      min-width: 60px;
    }
    .cd-n {
      font-size: 26px;
      font-weight: 900;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .cd-t {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.4);
    }
    .cd-date {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }

    /* WINNER */
    .winner-hero {
      background: linear-gradient(135deg, rgba(201,162,39,0.2), rgba(255,215,0,0.1));
      border: 1px solid rgba(255,215,0,0.3);
      border-radius: 20px;
      padding: 28px 36px;
      margin-bottom: 24px;
    }
    .wh-icon { font-size: 42px; margin-bottom: 8px; }
    .wh-label {
      font-size: 11px;
      letter-spacing: 4px;
      color: #c9a227;
      font-weight: 800;
    }
    .wh-name {
      font-size: 28px;
      font-weight: 900;
      color: #fff;
      margin: 4px 0;
    }
    .wh-folio {
      font-size: 15px;
      color: rgba(255,255,255,0.6);
    }

    /* CTA BUTTON */
    .cta-main {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 18px 40px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #c9a227, #f0c94e);
      color: #1a1a2e;
      font-size: 17px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 8px 32px rgba(201,162,39,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
      font-family: inherit;
    }
    .cta-main:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 44px rgba(201,162,39,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .cta-arrow {
      transition: transform 0.3s;
    }
    .cta-main:hover .cta-arrow {
      transform: translateX(4px);
    }
    .cta-large {
      padding: 22px 52px;
      font-size: 19px;
    }
    .cta-note {
      margin-top: 14px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }

    /* LOADING */
    .loading-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: rgba(255,255,255,0.6);
    }
    .spinner-big {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #c9a227;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ===== SECTIONS ===== */
    .section {
      padding: 80px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .section-how {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #050a15 0%, #0d1a2e 50%, #0a1628 100%);
      max-width: 100%;
    }
    .section-dark {
      background: #0a1628;
      max-width: 100%;
      border-top: 1px solid rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      position: relative;
      overflow: hidden;
    }
    .orb-5 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(27,94,32,0.15), transparent 70%);
      top: -30%; left: 20%;
    }

    .section-header {
      text-align: center;
      margin-bottom: 52px;
    }
    .sh-badge {
      display: inline-block;
      background: rgba(76,175,80,0.15);
      color: #81c784;
      padding: 6px 18px;
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: 3px;
      font-weight: 800;
      margin-bottom: 14px;
    }
    .sh-badge-gold {
      background: rgba(201,162,39,0.2);
      color: #f0c94e;
    }
    .sh-title {
      font-size: clamp(24px, 4vw, 36px);
      font-weight: 800;
      color: #fff;
      margin-bottom: 10px;
    }
    .sh-sub {
      color: rgba(255,255,255,0.5);
      font-size: 16px;
    }

    /* STEPS */
    .steps-grid {
      display: flex;
      align-items: stretch;
      gap: 0;
      justify-content: center;
    }
    .step-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 22px;
      padding: 36px 24px;
      text-align: center;
      flex: 1;
      max-width: 280px;
      position: relative;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      overflow: hidden;
    }
    .step-card:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: rgba(201,162,39,0.3);
      box-shadow: 0 24px 64px rgba(201,162,39,0.15);
    }
    .step-featured {
      border-color: rgba(201,162,39,0.3);
      background: rgba(201,162,39,0.05);
    }
    .step-badge {
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #c9a227, #f0c94e);
      color: #1a1a2e;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 2px;
      padding: 4px 16px;
      border-radius: 0 0 10px 10px;
    }
    .step-num {
      font-size: 52px;
      font-weight: 900;
      color: rgba(255,255,255,0.08);
      line-height: 1;
      margin-bottom: -12px;
    }
    .step-icon-wrap {
      width: 68px;
      height: 68px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 18px auto;
      transition: all 0.3s;
    }
    .step-card:hover .step-icon-wrap {
      transform: scale(1.1) rotate(5deg);
    }
    .step-icon-gold {
      background: rgba(201,162,39,0.15);
      border-color: rgba(201,162,39,0.3);
    }
    .step-icon {
      font-size: 30px;
    }
    .step-card h3 {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 8px;
    }
    .step-card p {
      font-size: 13px;
      color: rgba(255,255,255,0.55);
      line-height: 1.6;
    }
    .step-glow {
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 80px;
      background: radial-gradient(ellipse, rgba(201,162,39,0.15), transparent 70%);
      opacity: 0;
      transition: opacity 0.4s;
    }
    .step-card:hover .step-glow {
      opacity: 1;
    }
    .step-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 12px;
    }
    .sc-line {
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent);
      border-radius: 2px;
    }
    .sc-dot {
      width: 5px;
      height: 5px;
      background: rgba(201,162,39,0.7);
      border-radius: 50%;
    }
    .sc-dot:nth-child(2) { opacity: 0.7; }
    .sc-dot:nth-child(3) { opacity: 0.4; }
    .sc-dot:nth-child(4) { opacity: 0.2; }

    /* FEATURES */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .feature-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 22px;
      padding: 32px 24px;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      overflow: hidden;
    }
    .feature-card:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(201,162,39,0.25);
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 48px rgba(201,162,39,0.1);
    }
    .fc-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
      transition: transform 0.3s;
    }
    .feature-card:hover .fc-icon-wrap {
      transform: scale(1.1) rotate(-5deg);
    }
    .fc-gold {
      background: rgba(201,162,39,0.15);
      border: 1px solid rgba(201,162,39,0.2);
    }
    .fc-green {
      background: rgba(76,175,80,0.15);
      border: 1px solid rgba(76,175,80,0.2);
    }
    .fc-blue {
      background: rgba(33,150,243,0.15);
      border: 1px solid rgba(33,150,243,0.2);
    }
    .fc-purple {
      background: rgba(156,39,176,0.15);
      border: 1px solid rgba(156,39,176,0.2);
    }
    .fc-icon {
      font-size: 26px;
    }
    .feature-card h4 {
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .feature-card p {
      color: rgba(255,255,255,0.55);
      font-size: 13px;
      line-height: 1.6;
    }
    .fc-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
      transition: left 0.5s ease;
      pointer-events: none;
    }
    .feature-card:hover .fc-shine {
      left: 120%;
    }

    /* CTA SECTION */
    .stats-bar {
      background: #070e1a;
      border-top: 1px solid rgba(201,162,39,0.12);
      border-bottom: 1px solid rgba(201,162,39,0.12);
      padding: 40px 24px;
    }
    .sb-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .sb-item {
      text-align: center;
      min-width: 120px;
    }
    .sb-n {
      font-size: 28px;
      font-weight: 900;
      color: #f0c94e;
    }
    .sb-t {
      font-size: 11px;
      color: rgba(255,255,255,0.65);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .sb-divider {
      width: 1px;
      height: 36px;
      background: rgba(201,162,39,0.2);
    }
    .cta-guarantee {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .cta-guarantee span {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }
    .cta-section {
      position: relative;
      padding: 80px 24px;
      overflow: hidden;
    }
    .cta-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(165deg, #050a15, #0d2137);
    }
    .orb-4 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(201,162,39,0.2), transparent 70%);
      top: -20%; right: 10%;
    }
    .cta-content {
      position: relative;
      z-index: 2;
      text-align: center;
    }
    .cta-content h2 {
      font-size: clamp(24px, 4vw, 36px);
      font-weight: 800;
      color: #fff;
      margin-bottom: 10px;
    }
    .cta-content p {
      color: rgba(255,255,255,0.6);
      margin-bottom: 28px;
      font-size: 16px;
    }

    /* FOOTER */
    .footer {
      background: #030712;
      text-align: center;
      padding: 40px 24px;
      border-top: 1px solid rgba(255,255,255,0.03);
    }
    .footer-inner {
      max-width: 600px;
      margin: 0 auto;
    }
    .footer-brand {
      font-size: 15px;
      letter-spacing: 4px;
      color: rgba(255,255,255,0.7);
      font-weight: 800;
      margin-bottom: 12px;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .footer-links span {
      font-size: 12px;
      color: rgba(255,255,255,0.45);
    }
    .footer-dot {
      color: rgba(201,162,39,0.4) !important;
    }
    .footer-copy {
      font-size: 11px;
      color: rgba(255,255,255,0.3);
    }


    /* ===== ANIMACIONES GPU-ACCELERATED ===== */

    /* Scroll reveal - fade in up */
    .step-card, .feature-card {
      opacity: 0;
      transform: translateY(30px);
      animation: fadeUp 0.6s ease forwards;
    }
    .step-card:nth-child(1), .feature-card:nth-child(1) { animation-delay: 0.1s; }
    .step-card:nth-child(3), .feature-card:nth-child(2) { animation-delay: 0.2s; }
    .step-card:nth-child(5), .feature-card:nth-child(3) { animation-delay: 0.3s; }
    .feature-card:nth-child(4) { animation-delay: 0.4s; }
    @keyframes fadeUp {
      to { opacity: 1; transform: translateY(0); }
    }

    /* Hero content stagger */
    .hero-badge {
      opacity: 0;
      animation: fadeDown 0.5s ease 0.1s forwards;
    }
    .hero-title {
      opacity: 0;
      animation: fadeUp 0.6s ease 0.2s forwards;
    }
    .hero-sub {
      opacity: 0;
      animation: fadeUp 0.6s ease 0.35s forwards;
    }
    .prize-card {
      opacity: 0;
      animation: fadeUp 0.7s ease 0.5s forwards;
    }
    .hero-stats {
      opacity: 0;
      animation: fadeUp 0.6s ease 0.65s forwards;
    }
    .countdown, .cta-main, .cta-note {
      opacity: 0;
      animation: fadeUp 0.6s ease 0.8s forwards;
    }
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Floating particles */
    .hero-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(2px 2px at 20% 30%, rgba(201,162,39,0.4), transparent),
        radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 60% 20%, rgba(201,162,39,0.3), transparent),
        radial-gradient(2px 2px at 80% 50%, rgba(255,255,255,0.15), transparent),
        radial-gradient(1px 1px at 10% 80%, rgba(201,162,39,0.25), transparent),
        radial-gradient(2px 2px at 70% 85%, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 90% 15%, rgba(201,162,39,0.35), transparent),
        radial-gradient(2px 2px at 50% 45%, rgba(255,255,255,0.12), transparent);
      background-size: 100% 100%;
      animation: particleFloat 12s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes particleFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
      50% { transform: translateY(-15px) rotate(1deg); opacity: 1; }
    }

    /* Magnetic hover on CTA */
    .cta-main {
      position: relative;
      overflow: hidden;
    }
    .cta-main::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }
    .cta-main:hover::before {
      transform: translateX(100%);
    }

    /* Card hover glow */
    .step-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 21px;
      background: linear-gradient(135deg, rgba(201,162,39,0), rgba(201,162,39,0.3), rgba(201,162,39,0));
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;
    }
    .step-card:hover::before {
      opacity: 1;
    }

    /* Number count-up feel on stats */
    .hs-n {
      transition: transform 0.2s;
    }
    .hs:hover .hs-n {
      transform: scale(1.1);
    }

    /* Prize card tilt on hover */
    .prize-card {
      transition: transform 0.3s ease;
    }
    .prize-card:hover {
      transform: perspective(600px) rotateX(2deg) rotateY(-2deg);
    }

    /* Section header line reveal */
    .section-header::after {
      content: '';
      display: block;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #c9a227, #4caf50);
      margin: 16px auto 0;
      border-radius: 3px;
      animation: lineGrow 0.8s ease 0.3s forwards;
      transform: scaleX(0);
    }
    @keyframes lineGrow {
      to { transform: scaleX(1); }
    }

    /* Smooth pulse on countdown numbers */
    .cd-n {
      transition: transform 0.15s;
    }
    .cd-box:hover .cd-n {
      transform: scale(1.15);
    }

    /* Badge glow */
    .hero-badge {
      box-shadow: 0 0 20px rgba(201,162,39,0.15);
      animation: fadeDown 0.5s ease 0.1s forwards, badgeGlow 3s ease-in-out infinite 1s;
    }
    @keyframes badgeGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(201,162,39,0.15); }
      50% { box-shadow: 0 0 30px rgba(201,162,39,0.3); }
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .hero-content { padding: 16px 16px 48px; }
      .pc-inner { flex-direction: column; text-align: center; }
      .pc-info { text-align: center; }
      .pc-image-wrap { width: 120px; height: 120px; }
      .hero-stats { gap: 14px; }
      .hs-divider { display: none; }
      .cd-grid { gap: 8px; }
      .cd-box { min-width: 52px; padding: 10px 8px; }
      .cd-n { font-size: 20px; }
      .steps-grid { flex-direction: column; align-items: center; }
      .step-connector { transform: rotate(90deg); padding: 8px 0; }
      .step-card { max-width: 100%; width: 100%; }
      .section { padding: 56px 16px; }
    }
  `]
})
export class LandingComponent implements OnInit {
  raffle = signal<PublicRaffle | null>(null);
  slug = '';

  cdDaysVal = signal('--');
  cdHoursVal = signal('--');
  cdMinsVal = signal('--');
  cdSecsVal = signal('--');
  private cdInterval: any;

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
        this.toast.error('Sorteo no encontrado', 'Verifica el enlace');
      },
    });
  }

  private startCountdown(dateStr: string) {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    const target = new Date(+parts[0], +parts[1]-1, +parts[2], 12, 0, 0).getTime();
    if (this.cdInterval) clearInterval(this.cdInterval);
    const tick = () => {
      const diff = target - Date.now();
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
      return dt.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  }

  goToBoard() {
    this.router.navigate(['/sorteo', this.slug, 'tablero']);
  }
}
