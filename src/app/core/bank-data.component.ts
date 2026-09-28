import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BANK_DATA } from './bank-data';
import { ToastService } from './toast.service';

/** Tarjeta con datos bancarios + botones de copiar. */
@Component({
  selector: 'app-bank-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bank-box" [class.compact]="compact">
      <div class="bank-title">
        <span class="icon">💳</span>
        <span>Datos para tu pago</span>
      </div>
      <p class="bank-hint">
        Realiza tu transferencia y envía la captura por WhatsApp para confirmar
        tu lugar.
      </p>

      <div class="bank-row" (click)="copy(data.beneficiary, 'Beneficiario')">
        <div>
          <div class="k">Beneficiario</div>
          <div class="v">{{ data.beneficiary }}</div>
        </div>
        <button type="button" class="copy" title="Copiar">📋</button>
      </div>

      <div class="bank-row" (click)="copy(data.clabe, 'CLABE')">
        <div>
          <div class="k">CLABE</div>
          <div class="v mono">{{ data.clabe }}</div>
        </div>
        <button type="button" class="copy" title="Copiar">📋</button>
      </div>

      <div class="bank-row" (click)="copy(data.accountNumber, 'Cuenta')">
        <div>
          <div class="k">Número de cuenta</div>
          <div class="v mono">{{ data.accountNumber }}</div>
        </div>
        <button type="button" class="copy" title="Copiar">📋</button>
      </div>

      <div class="bank-row" (click)="copy(data.cardNumber, 'Tarjeta')">
        <div>
          <div class="k">Número de tarjeta</div>
          <div class="v mono">{{ data.cardNumber }}</div>
        </div>
        <button type="button" class="copy" title="Copiar">📋</button>
      </div>

      <button type="button" class="copy-all" (click)="copyAll()">
        📋 Copiar todos los datos
      </button>
    </div>
  `,
  styles: [
    `
      .bank-box {
        width: 100%;
        background: #e8f5e9;
        border: 2px solid #a5d6a7;
        border-radius: 14px;
        padding: 16px 14px 14px;
        text-align: left;
        box-sizing: border-box;
      }
      .bank-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 6px;
      }
      .bank-title .icon {
        font-size: 18px;
      }
      .bank-hint {
        margin: 0 0 12px;
        font-size: 12.5px;
        color: #2e7d32;
        line-height: 1.45;
      }
      .bank-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: #fff;
        border-radius: 10px;
        padding: 10px 12px;
        margin-bottom: 8px;
        cursor: pointer;
        border: 1px solid #c8e6c9;
      }
      .bank-row:active {
        background: #f1f8e9;
      }
      .k {
        font-size: 10px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .v {
        font-size: 15px;
        font-weight: 700;
        color: #1b5e20;
        margin-top: 2px;
        word-break: break-all;
      }
      .v.mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: 0.4px;
      }
      .copy {
        flex-shrink: 0;
        border: none;
        background: #c8e6c9;
        border-radius: 8px;
        width: 36px;
        height: 36px;
        font-size: 15px;
        cursor: pointer;
      }
      .copy-all {
        width: 100%;
        margin-top: 4px;
        padding: 12px;
        border: none;
        border-radius: 10px;
        background: #1b5e20;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }
      .compact .bank-hint {
        display: none;
      }
    `,
  ],
})
export class BankDataComponent {
  @Input() compact = false;

  data = BANK_DATA;

  constructor(private toast: ToastService) {}

  copy(value: string, label: string) {
    navigator.clipboard.writeText(value).then(() => {
      this.toast.success('Copiado', `${label}: ${value}`);
    });
  }

  copyAll() {
    const text =
      `Beneficiario: ${this.data.beneficiary}\n` +
      `Cuenta: ${this.data.accountNumber}\n` +
      `CLABE: ${this.data.clabe}\n` +
      `Tarjeta: ${this.data.cardNumber}`;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copiado', 'Todos los datos bancarios');
    });
  }
}
