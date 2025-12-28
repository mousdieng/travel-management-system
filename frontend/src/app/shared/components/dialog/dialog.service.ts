import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export interface DialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<{ config: DialogConfig; result: Subject<DialogResult> }>();
  public dialogState$ = this.dialogSubject.asObservable();

  public open(config: DialogConfig): Promise<DialogResult> {
    const resultSubject = new Subject<DialogResult>();

    const dialogConfig: DialogConfig = {
      ...config,
      type: config.type || 'info',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      showCancel: config.showCancel !== undefined ? config.showCancel : config.type === 'confirm'
    };

    this.dialogSubject.next({ config: dialogConfig, result: resultSubject });

    return new Promise((resolve) => {
      resultSubject.subscribe((result) => {
        resolve(result);
      });
    });
  }

  public alert(message: string, title: string = 'Alert'): Promise<DialogResult> {
    return this.open({
      title,
      message,
      type: 'info',
      showCancel: false
    });
  }

  public confirm(message: string, title: string = 'Confirm'): Promise<DialogResult> {
    return this.open({
      title,
      message,
      type: 'confirm',
      showCancel: true
    });
  }

  public error(message: string, title: string = 'Error'): Promise<DialogResult> {
    return this.open({
      title,
      message,
      type: 'error',
      showCancel: false
    });
  }

  public success(message: string, title: string = 'Success'): Promise<DialogResult> {
    return this.open({
      title,
      message,
      type: 'success',
      showCancel: false
    });
  }

  public warning(message: string, title: string = 'Warning'): Promise<DialogResult> {
    return this.open({
      title,
      message,
      type: 'warning',
      showCancel: false
    });
  }
}
