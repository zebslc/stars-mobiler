import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/core/toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast-info]="toast.type === 'info'"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-warning]="toast.type === 'warning'"
          (click)="toastService.remove(toast.id)"
        >
          <span>{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: var(--space-md);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      cursor: pointer;
      gap: var(--space-md);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-info {
      background: #3498db;
      color: white;
    }

    .toast-success {
      background: #2ecc71;
      color: white;
    }

    .toast-error {
      background: #e74c3c;
      color: white;
    }

    .toast-warning {
      background: #f39c12;
      color: white;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @media (max-width: 640px) {
      .toast-container {
        right: var(--space-sm);
        left: var(--space-sm);
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
  toasts = this.toastService.toasts$;
}
