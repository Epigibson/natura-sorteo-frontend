import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scratch-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="scratch-wrap" #wrap>
      <div class="prize-side">
        <div class="label">Tu boleto cuesta</div>
        <div class="amount">{{ isRevealed() ? '\$' + amount : '\$?' }}</div>
        <div class="pie">Paga este monto y asegura tu lugar</div>
      </div>
      <canvas #canvas id="scratchCanvas"></canvas>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar" [style.width.%]="progress()"></div>
    </div>

    @if (isRevealed()) {
      <div class="hint success">{{ isRevealed() ? '¡Tu boleto cuesta \$' + amount + '!' : 'Raspa para descubrir' }}</div>
    } @else {
      <div class="hint">Raspa con el dedo la zona plateada ✨</div>
    }
  `,
  styles: [
    `
      .scratch-wrap {
        position: relative;
        width: 280px;
        height: 165px;
        margin: 0 auto 14px;
        border-radius: 18px;
        overflow: hidden;
        background: #fff;
        box-shadow:
          inset 0 2px 12px rgba(0, 0, 0, 0.12),
          0 6px 20px rgba(0, 0, 0, 0.1);
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .scratch-wrap:active {
        cursor: grabbing;
      }
      .prize-side {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, #fff8e1 0%, #ffecb3 100%);
        gap: 2px;
      }
      .prize-side .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2.5px;
        color: #8d6e00;
        font-weight: 700;
      }
      .prize-side .amount {
        font-size: 52px;
        font-weight: 900;
        color: #1b5e20;
        line-height: 1;
        text-shadow: 0 2px 0 rgba(255, 255, 255, 0.6);
      }
      .prize-side .pie {
        font-size: 11px;
        color: #8d6e00;
        font-weight: 600;
        margin-top: 2px;
      }
      canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        border-radius: 18px;
        transition: opacity 0.5s ease;
      }
      canvas.revealed {
        opacity: 0;
        pointer-events: none;
      }
      .progress-wrap {
        width: 280px;
        margin: 0 auto 12px;
        background: #e5e7eb;
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4caf50, #c9a227);
        border-radius: 999px;
        transition: width 0.18s ease;
      }
      .hint {
        text-align: center;
        font-size: 13px;
        color: #6b7280;
        min-height: 20px;
        line-height: 1.45;
      }
      .hint.success {
        color: #1b5e20;
        font-weight: 700;
        font-size: 14px;
      }
      @media (max-width: 480px) {
        .scratch-wrap { width: 260px; height: 150px; }
        .progress-wrap { width: 260px; }
        .prize-side .amount { font-size: 44px; }
      }
    `,
  ],
})
export class ScratchCardComponent implements AfterViewInit, OnDestroy {
  @Input() amount = 0;
  @Output() revealed = new EventEmitter<void>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrap', { static: true }) wrapRef!: ElementRef<HTMLDivElement>;

  readonly progress = signal(0);
  readonly isRevealed = signal(false);

  private ctx: CanvasRenderingContext2D | null = null;
  private rascando = false;
  private ultimaPos: { x: number; y: number } | null = null;
  private umbral = 0.46;
  private resizeObserver: ResizeObserver | null = null;

  // Handlers bound para removeEventListener
  private _onMouseDown = (e: Event) => this.iniciar(e as MouseEvent);
  private _onMouseMove = (e: Event) => {
    if (this.rascando) this.alRaspar(e as MouseEvent);
  };
  private _onMouseUp = () => this.terminar();
  private _onTouchStart = (e: Event) => this.iniciar(e as TouchEvent);
  private _onTouchMove = (e: Event) => this.alRaspar(e as TouchEvent);
  private _onTouchEnd = () => this.terminar();

  ngAfterViewInit() {
    // Doble frame para layout estable
    requestAnimationFrame(() => requestAnimationFrame(() => this.preparar()));
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.isRevealed()) this.preparar();
    });
    this.resizeObserver.observe(this.wrapRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.desconectar();
  }

  private preparar() {
    const canvas = this.canvasRef.nativeElement;
    const wrap = this.wrapRef.nativeElement;
    const rect = wrap.getBoundingClientRect();
    if (!rect.width) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.pintarCapa(rect.width, rect.height);
    this.conectar();
    this.progress.set(0);
    this.ultimaPos = null;
  }

  private pintarCapa(w: number, h: number) {
    const ctx = this.ctx!;
    // Gradiente plateado estilo boleto de lotería
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#b0b7bd');
    grad.addColorStop(0.35, '#c5ccd3');
    grad.addColorStop(0.55, '#a8b0b8');
    grad.addColorStop(1, '#9aa3ab');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Brillos
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(w * (0.12 + i * 0.13), h * 0.28, 24, 11, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Texto
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font =
      '700 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆  RASPA AQUÍ  👆', w / 2, h / 2 - 10);
    ctx.font =
      '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('Desliza el dedo sobre esta zona', w / 2, h / 2 + 16);
  }

  private conectar() {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd);
    canvas.addEventListener('touchcancel', this._onTouchEnd);
  }

  private desconectar() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.removeEventListener('mousedown', this._onMouseDown);
    canvas.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    canvas.removeEventListener('touchstart', this._onTouchStart);
    canvas.removeEventListener('touchmove', this._onTouchMove);
    canvas.removeEventListener('touchend', this._onTouchEnd);
    canvas.removeEventListener('touchcancel', this._onTouchEnd);
  }

  private posicion(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const p =
      'touches' in e && e.touches[0]
        ? e.touches[0]
        : (e as MouseEvent);
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  private iniciar(e: MouseEvent | TouchEvent) {
    if (this.isRevealed()) return;
    e.preventDefault();
    this.rascando = true;
    this.ultimaPos = null;
    this.alRaspar(e);
  }

  private terminar() {
    this.rascando = false;
    this.ultimaPos = null;
  }

  private alRaspar(e: MouseEvent | TouchEvent) {
    if (this.isRevealed() || !this.ctx) return;
    e.preventDefault();
    const p = this.posicion(e);
    const ctx = this.ctx;

    ctx.globalCompositeOperation = 'destination-out';

    if (this.ultimaPos) {
      ctx.lineWidth = 38;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.ultimaPos.x, this.ultimaPos.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, 23, 0, Math.PI * 2);
    ctx.fill();

    this.ultimaPos = p;
    this.evaluar();
  }

  private evaluar() {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    let datos: ImageData;
    try {
      datos = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      return;
    }
    const d = datos.data;
    let total = 0;
    let transparente = 0;
    for (let i = 3; i < d.length; i += 16) {
      total++;
      if (d[i] < 128) transparente++;
    }
    const pct = total ? transparente / total : 0;
    // Escalar visualmente un poco para que la barra llene antes
    this.progress.set(Math.min(100, Math.round(pct * 100 * 1.35)));

    if (pct >= this.umbral && !this.isRevealed()) {
      this.revelar();
    }
  }

  private revelar() {
    this.isRevealed.set(true);
    this.progress.set(100);
    const canvas = this.canvasRef.nativeElement;
    canvas.classList.add('revealed');
    this.desconectar();
    this.revealed.emit();
    this.lanzarConfetti();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([45, 65, 45]);
      } catch {}
    }
  }

  /** Revelar programáticamente (si el servidor ya tiene el monto raspado) */
  revelarYa() {
    if (this.isRevealed()) return;
    this.isRevealed.set(true);
    this.progress.set(100);
    const canvas = this.canvasRef.nativeElement;
    canvas.classList.add('revealed');
    this.desconectar();
  }

  private lanzarConfetti() {
    const colores = ['#c9a227', '#4caf50', '#1b5e20', '#ff7043', '#fff176', '#81c784', '#fff'];
    for (let i = 0; i < 36; i++) {
      const pieza = document.createElement('div');
      pieza.style.cssText = `
        position:fixed;
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        top:-14px;
        left:${Math.random() * 100}vw;
        background:${colores[Math.floor(Math.random() * colores.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        z-index:99999;
        pointer-events:none;
        opacity:1;
        animation:sc-fall ${1.8 + Math.random() * 1.2}s linear ${Math.random() * 0.5}s forwards;
      `;
      document.body.appendChild(pieza);
      setTimeout(() => pieza.remove(), 3600);
    }
    // Inyectar keyframes si no existen
    if (!document.getElementById('sc-keyframes')) {
      const style = document.createElement('style');
      style.id = 'sc-keyframes';
      style.textContent = `
        @keyframes sc-fall {
          0%   { opacity:1; transform:translateY(0) rotate(0deg); }
          100% { opacity:0; transform:translateY(105vh) rotate(720deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
