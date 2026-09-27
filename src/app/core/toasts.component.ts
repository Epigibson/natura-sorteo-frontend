import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.type" (click)="toast.dismiss(t.id)">
          <div class="icon">
            @switch (t.type) {
              @case ('success') { ✅ }
              @case ('error') { ❌ }
              @case ('warning') { ⚠️ }
              @case ('info') { ℹ️ }
            }
          </div>
          <div class="body">
            <div class="title">{{ t.title }}</div>
            @if (t.message) {
              <div class="msg">{{ t.message }}</div>
            }
          </div>
          <button class="close" (click)="toast.dismiss(t.id); $event.stopPropagation()">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        width: calc(100vw - 36px);
        pointer-events: none;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        background: #fff;
        border-radius: 14px;
        padding: 14px 14px 14px 16px;
        box-shadow: 0 10px 36px rgba(0, 0, 0, 0.14);
        border-left: 4px solid #ccc;
        pointer-events: auto;
        cursor: pointer;
        animation: slideIn 0.28s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(40px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .toast-success {
        border-left-color: #2e7d32;
      }
      .toast-error {
        border-left-color: #c62828;
      }
      .toast-warning {
        border-left-color: #e65100;
      }
      .toast-info {
        border-left-color: #1565c0;
      }
      .icon {
        font-size: 18px;
        line-height: 1.2;
        flex-shrink: 0;
      }
      .body {
        flex: 1;
        min-width: 0;
      }
      .title {
        font-weight: 800;
        font-size: 13.5px;
        color: #1f2937;
      }
      .msg {
        font-size: 12.5px;
        color: #6b7280;
        margin-top: 2px;
        line-height: 1.45;
      }
      .close {
        background: none;
        border: none;
        font-size: 18px;
        color: #9ca3af;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;
        flex-shrink: 0;
      }
      .close:hover {
        color: #374151;
      }
      @media (max-width: 480px) {
        .toast-stack { top: 10px; right: 10px; left: 10px; max-width: none; width: auto; }
        .toast { padding: 12px; }
        .title { font-size: 13px; }
        .msg { font-size: 12px; }
      }
    `,
  ],
})
export class ToastsComponent {
  constructor(public toast: ToastService) {}
}
