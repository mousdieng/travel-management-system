import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$ = this.toastSubject.asObservable();

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public show(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 5000,
    action?: { label: string; handler: () => void }
  ): string {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration,
      action
    };

    this.toastSubject.next(toast);
    return toast.id;
  }

  public success(message: string, duration: number = 5000): string {
    return this.show(message, 'success', duration);
  }

  public error(message: string, duration: number = 7000): string {
    return this.show(message, 'error', duration);
  }

  public warning(message: string, duration: number = 6000): string {
    return this.show(message, 'warning', duration);
  }

  public info(message: string, duration: number = 5000): string {
    return this.show(message, 'info', duration);
  }
}
