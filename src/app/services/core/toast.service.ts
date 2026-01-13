import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 0;

  readonly toasts$ = this.toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };

    this.toasts.update((toasts) => [...toasts, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: number) {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  warning(message: string, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }
}
