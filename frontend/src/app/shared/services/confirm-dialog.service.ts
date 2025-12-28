import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: data.title || 'Confirm Action',
        message: data.message,
        confirmText: data.confirmText || 'Confirm',
        cancelText: data.cancelText || 'Cancel',
        confirmColor: data.confirmColor || 'primary',
        icon: data.icon
      },
      disableClose: true,
      autoFocus: true
    });

    return dialogRef.afterClosed();
  }

  confirmDelete(itemName?: string, customMessage?: string): Observable<boolean> {
    const message = customMessage ||
      (itemName
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : 'Are you sure you want to delete this item? This action cannot be undone.'
      );

    return this.confirm({
      title: 'Delete Item',
      message,
      confirmText: 'Delete',
      confirmColor: 'warn',
      icon: 'warning'
    });
  }

  confirmSave(hasChanges: boolean = true): Observable<boolean> {
    if (!hasChanges) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return this.confirm({
      title: 'Save Changes',
      message: 'You have unsaved changes. Do you want to save them?',
      confirmText: 'Save',
      cancelText: 'Discard',
      confirmColor: 'primary',
      icon: 'save'
    });
  }

  confirmUnsavedChanges(): Observable<boolean> {
    return this.confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave without saving?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      confirmColor: 'warn',
      icon: 'warning'
    });
  }

  confirmBulkAction(actionName: string, itemCount: number): Observable<boolean> {
    return this.confirm({
      title: `Bulk ${actionName}`,
      message: `Are you sure you want to ${actionName.toLowerCase()} ${itemCount} selected item(s)?`,
      confirmText: actionName,
      confirmColor: actionName.toLowerCase().includes('delete') ? 'warn' : 'primary',
      icon: actionName.toLowerCase().includes('delete') ? 'warning' : 'info'
    });
  }

  info(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      confirmColor: 'primary',
      icon: 'info'
    });
  }

  warn(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      confirmColor: 'warn',
      icon: 'warning'
    });
  }

  error(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      confirmColor: 'warn',
      icon: 'error'
    });
  }
}