import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { PublicRaffle } from '../../core/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-overlay"></div>
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
            Gánate el
            <span class="title-highlight">{{ r.prize }}</span>
          </h1>

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
            <p class="cta-note">Solo 21 boletos · Precio al raspar · Todos ganan oportunidad</p>
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
    <section class="section">
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
        </div>

        <div class="step-connector">
          <div class="sc-line"></div>
          <div class="sc-dot"></div>
        </div>

        <div class="step-card">
          <div class="step-num">02</div>
          <div class="step-icon-wrap">
            <div class="step-icon">✨</div>
          </div>
          <h3>Raspa y descubre</h3>
          <p>Desliza el dedo sobre el raspadito digital y descubre cuánto cuesta tu boleto.</p>
        </div>

        <div class="step-connector">
          <div class="sc-line"></div>
          <div class="sc-dot"></div>
        </div>

        <div class="step-card">
          <div class="step-num">03</div>
          <div class="step-icon-wrap">
            <div class="step-icon">🏆</div>
          </div>
          <h3>Paga y participa</h3>
          <p>Realiza tu pago y entras al sorteo del premio. ¡Todos tienen la misma probabilidad!</p>
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
        <div class="feature-card">
          <div class="fc-icon">🎲</div>
          <h4>El precio lo eliges tú</h4>
          <p>Cada boleto tiene un precio entre \${{ raffle()?.price_min }} y \${{ raffle()?.price_max }}. Lo descubres al raspar.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">⚖️</div>
          <h4>Misma probabilidad</h4>
          <p>Pagues $30 o $50, todos tienen la misma oportunidad de ganar el premio.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">🔒</div>
          <h4>100% transparente</h4>
          <p>Sorteo en vivo y resultado registrado. Todo verificable y sin trucos.</p>
        </div>
        <div class="feature-card">
          <div class="fc-icon">⚡</div>
          <h4>Rápido y fácil</h4>
          <p>Elige, raspa y paga en minutos. Todo desde tu celular.</p>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-section">
      <div class="cta-bg">
        <div class="orb orb-4"></div>
      </div>
      <div class="cta-content">
        @if (!raffle()?.drawn) {
          <h2>¿Listo para raspar tu suerte?</h2>
          <p>Los boletos son limitados. Elige el tuyo ahora.</p>
          <button class="cta-main cta-large" (click)="goToBoard()">
            <span class="cta-text">Ver boletos disponibles</span>
            <span class="cta-arrow">→</span>
          </button>
        } @else {
          <h2>¡Sorteo realizado!</h2>
          <p>Gracias a todos los que participaron.</p>
        }
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-brand">🎟️ SORTEO NATURA</div>
      <p>Rifa privada entre conocidos · Todos los derechos reservados</p>
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
      font-size: clamp(32px, 6vw, 56px);
      font-weight: 800;
      color: #fff;
      line-height: 1.15;
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
      color: rgba(255,255,255,0.6);
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
      color: rgba(255,255,255,0.5);
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
      color: rgba(255,255,255,0.45);
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
      color: rgba(255,255,255,0.5);
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
      color: rgba(255,255,255,0.35);
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
    .section-dark {
      background: #0a1628;
      max-width: 100%;
      border-top: 1px solid rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .section-header {
      text-align: center;
      margin-bottom: 52px;
    }
    .sh-badge {
      display: inline-block;
      background: rgba(27,94,32,0.1);
      color: #1b5e20;
      padding: 6px 18px;
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: 3px;
      font-weight: 800;
      margin-bottom: 14px;
    }
    .sh-badge-gold {
      background: rgba(201,162,39,0.15);
      color: #c9a227;
    }
    .sh-title {
      font-size: clamp(24px, 4vw, 36px);
      font-weight: 800;
      color: #1a1a2e;
      margin-bottom: 10px;
    }
    .section-dark .sh-title {
      color: #fff;
    }
    .sh-sub {
      color: #6b7280;
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
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
      flex: 1;
      max-width: 280px;
      position: relative;
      transition: all 0.3s;
    }
    .step-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 48px rgba(0,0,0,0.08);
      border-color: #c8e6c9;
    }
    .step-num {
      font-size: 48px;
      font-weight: 900;
      color: #f0f0f0;
      line-height: 1;
      margin-bottom: -10px;
    }
    .step-icon-wrap {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px auto;
    }
    .step-icon {
      font-size: 28px;
    }
    .step-card h3 {
      font-size: 17px;
      font-weight: 800;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    .step-card p {
      font-size: 13.5px;
      color: #6b7280;
      line-height: 1.55;
    }
    .step-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
    }
    .sc-line {
      width: 32px;
      height: 2px;
      background: linear-gradient(90deg, #c8e6c9, #c9a227);
      border-radius: 2px;
    }
    .sc-dot {
      width: 8px;
      height: 8px;
      background: #c9a227;
      border-radius: 50%;
      margin-top: 4px;
    }

    /* FEATURES */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .feature-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 18px;
      padding: 28px 22px;
      transition: all 0.3s;
    }
    .feature-card:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(201,162,39,0.2);
      transform: translateY(-4px);
    }
    .fc-icon {
      font-size: 32px;
      margin-bottom: 14px;
    }
    .feature-card h4 {
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .feature-card p {
      color: rgba(255,255,255,0.5);
      font-size: 13.5px;
      line-height: 1.55;
    }

    /* CTA SECTION */
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
      color: rgba(255,255,255,0.5);
      margin-bottom: 28px;
      font-size: 16px;
    }

    /* FOOTER */
    .footer {
      background: #050a15;
      text-align: center;
      padding: 32px 24px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .footer-brand {
      font-size: 13px;
      letter-spacing: 3px;
      color: rgba(255,255,255,0.6);
      font-weight: 700;
      margin-bottom: 8px;
    }
    .footer p {
      font-size: 12px;
      color: rgba(255,255,255,0.25);
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
