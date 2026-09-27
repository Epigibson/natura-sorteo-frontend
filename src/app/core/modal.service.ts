import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export interface PromptOptions {
  title: string;
  message: string;
  label?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly confirmState = signal<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, options: { title: '', message: '' }, resolve: null });

  readonly promptState = signal<{
    open: boolean;
    options: PromptOptions;
    resolve: ((v: string | null) => void) | null;
  }>({ open: false, options: { title: '', message: '' }, resolve: null });

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmState.set({ open: true, options, resolve });
    });
  }

  prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.promptState.set({ open: true, options, resolve });
    });
  }

  resolveConfirm(value: boolean) {
    const s = this.confirmState();
    s.resolve?.(value);
    this.confirmState.set({ open: false, options: { title: '', message: '' }, resolve: null });
  }

  resolvePrompt(value: string | null) {
    const s = this.promptState();
    s.resolve?.(value);
    this.promptState.set({ open: false, options: { title: '', message: '' }, resolve: null });
  }
}
