import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DrawWinner {
  folio: number;
  amount: number;
  participant?: { name?: string; phone?: string } | null;
}

type Phase = 'intro' | 'spin' | 'landing' | 'reveal';

/**
 * Escenario full-screen para el momento del sorteo (pensado para transmitir
 * por Meet/OBS: tipografía grande, fondo oscuro, secuencia con tensión).
 *
 * El padre llama a la API al abrir y pasa `result` cuando llega; el carrusel
 * sigue girando hasta tener resultado Y cumplir el tiempo mínimo de tensión.
 */
@Component({
  selector: 'app-draw-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draw-stage.component.html',
  styleUrl: './draw-stage.component.css',
})
export class DrawStageComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() prize = '';
  @Input() prizeValue = 0;
  @Input() totalPaid = 0;
  @Input() names: string[] = [];
  @Input() result: DrawWinner | null = null;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('stageEl') stageEl?: ElementRef<HTMLElement>;

  phase: Phase = 'intro';
  reelIndex = 0;
  landingStep = 0;
  landingSteps = 12;
  muted = false;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private spinStart = 0;
  private started = false;
  private audio: AudioContext | null = null;
  private lastTick = 0;

  get reelNames(): string[] {
    return this.names.length ? this.names : ['Participante'];
  }

  get displayRows(): { name: string; idx: number }[] {
    const n = this.reelNames.length;
    const at = (i: number) => ({ name: this.reelNames[((i % n) + n) % n], idx: ((i % n) + n) % n });
    return [at(this.reelIndex - 1), at(this.reelIndex), at(this.reelIndex + 1)];
  }

  get winnerName(): string {
    return this.result?.participant?.name || 'Ganador';
  }

  get isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  ngOnChanges(): void {
    if (this.open && !this.started) {
      this.started = true;
      this.startSequence();
    }
    if (this.open && this.result && this.phase === 'spin') {
      this.maybeLand();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.stopAudio();
  }

  close(): void {
    this.clearTimers();
    this.stopAudio();
    this.started = false;
    this.phase = 'intro';
    this.closed.emit();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.muted) this.stopAudio();
    else this.ensureAudio();
  }

  async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* el navegador puede negarlo; el escenario igual se ve completo */
    }
  }

  copyResult(): void {
    if (!this.result) return;
    const txt = `🏆 Ganador: ${this.winnerName} — Folio ${this.result.folio} (boleto de $${this.result.amount}) — ${this.title}`;
    navigator.clipboard?.writeText(txt);
  }

  // ---------- secuencia ----------
  private startSequence(): void {
    this.phase = 'intro';
    this.reelIndex = 0;
    this.landingStep = 0;
    this.spinStart = 0;
    this.ensureAudio();
    this.playIntro();
    // tambor + ruleta
    this.after(2200, () => {
      this.phase = 'spin';
      this.spinStart = Date.now();
      this.playDrumroll();
      this.fastSpin();
      this.maybeLand();
    });
  }

  private fastSpin(): void {
    if (this.phase !== 'spin') return;
    this.reelIndex = (this.reelIndex + 1) % this.reelNames.length;
    this.playTickSoft();
    this.after(55, () => this.fastSpin());
  }

  private maybeLand(): void {
    if (this.phase !== 'spin' || !this.result) return;
    const minSpin = 3800;
    const elapsed = Date.now() - this.spinStart;
    if (elapsed < minSpin) {
      this.after(minSpin - elapsed, () => this.maybeLand());
      return;
    }
    this.startLanding();
  }

  private startLanding(): void {
    this.phase = 'landing';
    this.landingStep = 0;
    // pasos con desaceleración; el último cae exactamente en el ganador
    const delays = [280, 240, 210, 190, 220, 260, 320, 400, 500, 640, 820, 1100];
    const winnerIdx = this.ensureWinnerInReel();
    const n = this.reelNames.length;
    let i = this.reelIndex;
    const step = (k: number) => {
      if (k >= delays.length) return;
      this.after(delays[k], () => {
        i = k === delays.length - 1 ? winnerIdx : (i + 1 + Math.floor(Math.random() * 2)) % n;
        this.reelIndex = i;
        this.landingStep = k + 1;
        this.playTick(k);
        step(k + 1);
        if (k === delays.length - 1) {
          this.after(650, () => this.reveal());
        }
      });
    };
    step(0);
  }

  private ensureWinnerInReel(): number {
    const w = this.winnerName;
    const idx = this.reelNames.findIndex((n) => n === w);
    if (idx >= 0) return idx;
    this.names = [...this.reelNames, w];
    return this.reelNames.length - 1;
  }

  private reveal(): void {
    this.phase = 'reveal';
    this.playFanfare();
    this.launchConfetti();
  }

  // ---------- confetti ----------
  private launchConfetti(): void {
    const colors = ['#c9a227', '#ffd54f', '#4caf50', '#1b5e20', '#fff176', '#ffffff', '#ff7043'];
    for (let i = 0; i < 110; i++) {
      const el = document.createElement('div');
      const left = Math.random() * 100;
      const dur = 2.4 + Math.random() * 2.2;
      const delay = Math.random() * 1.2;
      const size = 6 + Math.random() * 12;
      const color = colors[Math.floor(Math.random() * colors.length)];
      el.className = 'ds-confetti';
      el.style.cssText = `left:${left}vw;width:${size}px;height:${size * (Math.random() > 0.5 ? 1 : 0.5)}px;background:${color};animation-duration:${dur}s;animation-delay:${delay}s;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + delay) * 1000 + 200);
    }
  }

  // ---------- audio (WebAudio sintetizado, sin archivos) ----------
  private ensureAudio(): void {
    if (this.muted) return;
    try {
      if (!this.audio) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        this.audio = new Ctx();
      }
      if (this.audio.state === 'suspended') void this.audio.resume();
    } catch {
      this.audio = null;
    }
  }

  private stopAudio(): void {
    try {
      void this.audio?.close();
    } catch {
      /* noop */
    }
    this.audio = null;
  }

  private noiseBuffer(): AudioBuffer | null {
    if (!this.audio) return null;
    const ctx = this.audio;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private playIntro(): void {
    if (!this.audio || this.muted) return;
    const ctx = this.audio;
    [196, 247, 294].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + i * 0.18 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  }

  private playDrumroll(): void {
    if (!this.audio || this.muted) return;
    const ctx = this.audio;
    const buf = this.noiseBuffer();
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 220;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.02, t);
    g.gain.linearRampToValueAtTime(0.1, t + 3.6);
    g.gain.linearRampToValueAtTime(0.16, t + 5.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5.6);
    // trémolo para simular redoble
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 14;
    lfo.frequency.linearRampToValueAtTime(26, t + 5);
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 5.7);
    lfo.start(t);
    lfo.stop(t + 5.7);
  }

  private playTickSoft(): void {
    if (!this.audio || this.muted) return;
    const now = Date.now();
    if (now - this.lastTick < 90) return;
    this.lastTick = now;
    const ctx = this.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 700 + Math.random() * 120;
    g.gain.setValueAtTime(0.012, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.06);
  }

  private playTick(step: number): void {
    if (!this.audio || this.muted) return;
    const ctx = this.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1100 - step * 55, ctx.currentTime);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.14);
  }

  private playFanfare(): void {
    if (!this.audio || this.muted) return;
    const ctx = this.audio;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.14;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.9);
    });
    // pop de celebración
    const buf = this.noiseBuffer();
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      src.connect(g).connect(ctx.destination);
      src.start(t0);
      src.stop(t0 + 0.4);
    }
  }

  // ---------- util ----------
  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }
}
