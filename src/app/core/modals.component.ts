import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- CONFIRM -->
    @if (modal.confirmState().open) {
      <div class="overlay" (click)="modal.resolveConfirm(false)">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="d-icon">
            @switch (modal.confirmState().options.variant) {
              @case ('danger') { 🗑️ }
              @default { ❓ }
            }
          </div>
          <h3>{{ modal.confirmState().options.title }}</h3>
          <p class="msg">{{ modal.confirmState().options.message }}</p>
          <div class="actions">
            <button class="btn-ghost" (click)="modal.resolveConfirm(false)">
              {{ modal.confirmState().options.cancelLabel || 'Cancelar' }}
            </button>
            <button
              class="btn-solid"
              [class.danger]="modal.confirmState().options.variant === 'danger'"
              (click)="modal.resolveConfirm(true)"
            >
              {{ modal.confirmState().options.confirmLabel || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- PROMPT -->
    @if (modal.promptState().open) {
      <div class="overlay" (click)="modal.resolvePrompt(null)">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="d-icon">📝</div>
          <h3>{{ modal.promptState().options.title }}</h3>
          <p class="msg">{{ modal.promptState().options.message }}</p>
          <label class="field-label">
            {{ modal.promptState().options.label || 'Valor' }}
          </label>
          <input
            class="field-input"
            [(ngModel)]="promptValue"
            [placeholder]="modal.promptState().options.placeholder || ''"
            (keyup.enter)="submitPrompt()"
          />
          <div class="actions">
            <button class="btn-ghost" (click)="modal.resolvePrompt(null)">
              {{ modal.promptState().options.cancelLabel || 'Cancelar' }}
            </button>
            <button class="btn-solid" (click)="submitPrompt()">
              {{ modal.promptState().options.confirmLabel || 'Aceptar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.52);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9000;
        padding: 18px;
        animation: fadeIn 0.18s ease;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .dialog {
        background: #faf7f0;
        border-radius: 20px;
        padding: 28px 26px 24px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        animation: popIn 0.22s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(12px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .d-icon {
        font-size: 36px;
        text-align: center;
        margin-bottom: 8px;
      }
      h3 {
        text-align: center;
        margin: 0 0 8px;
        font-size: 18px;
        color: #1f2937;
      }
      .msg {
        text-align: center;
        color: #6b7280;
        font-size: 13.5px;
        line-height: 1.55;
        margin-bottom: 18px;
      }
      .field-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin-bottom: 6px;
      }
      .field-input {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 15px;
        outline: none;
        box-sizing: border-box;
      }
      .field-input:focus {
        border-color: #4caf50;
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.16);
      }
      .actions {
        display: flex;
        gap: 10px;
        margin-top: 22px;
      }
      .btn-ghost {
        flex: 1;
        padding: 12px;
        border-radius: 12px;
        border: 2px solid #d1d5db;
        background: transparent;
        color: #6b7280;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-ghost:hover {
        background: #f3f4f6;
      }
      .btn-solid {
        flex: 1;
        padding: 12px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-solid:hover {
        filter: brightness(1.06);
      }
      .btn-solid.danger {
        background: linear-gradient(135deg, #b71c1c, #e53935);
      }
      @media (max-width: 480px) {
        .dialog { padding: 22px 16px 18px; }
        .d-icon { font-size: 28px; }
        h3 { font-size: 16px; }
        .msg { font-size: 12.5px; margin-bottom: 14px; }
        .actions { flex-direction: column-reverse; gap: 8px; }
      }
    `,
  ],
})
export class ModalsComponent {
  promptValue = '';

  constructor(public modal: ModalService) {}

  submitPrompt() {
    const opts = this.modal.promptState().options;
    const val = this.promptValue.trim();
    if (opts.required && !val) return;
    this.modal.resolvePrompt(val);
    this.promptValue = '';
  }
}
