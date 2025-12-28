import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

interface ToastWithTimeout extends Toast {
  timeoutId?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit {
  public toasts = signal<ToastWithTimeout[]>([]);

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe((toast) => {
      this.addToast(toast);
    });
  }

  private addToast(toast: Toast): void {
    const toastWithTimeout: ToastWithTimeout = { ...toast };

    // Add to array
    this.toasts.update(toasts => [...toasts, toastWithTimeout]);

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      toastWithTimeout.timeoutId = window.setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  public removeToast(id: string): void {
    const toasts = this.toasts();
    const toast = toasts.find(t => t.id === id);

    if (toast?.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  public getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  }

  public getIconColor(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  }

  public getBackgroundColor(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  }

  public getTextColor(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      default:
        return 'text-blue-900';
    }
  }

  public onActionClick(toast: ToastWithTimeout): void {
    if (toast.action) {
      toast.action.handler();
      this.removeToast(toast.id);
    }
  }
}
