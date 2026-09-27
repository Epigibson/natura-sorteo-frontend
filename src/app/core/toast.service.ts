import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private counter = 0;

  show(type: ToastType, title: string, message = '', durationMs = 4200) {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, type, title, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(title: string, message = '') {
    this.show('success', title, message);
  }

  error(title: string, message = '') {
    this.show('error', title, message, 5600);
  }

  warning(title: string, message = '') {
    this.show('warning', title, message);
  }

  info(title: string, message = '') {
    this.show('info', title, message);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}
