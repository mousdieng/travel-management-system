import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  type?: 'warning' | 'danger' | 'info' | 'success';
  icon?: string;
}

/**
 * Reusable confirmation dialog component for user confirmations.
 * Supports different types and customizable text.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <mat-dialog-content class="dialog-content">
        <div class="dialog-icon" *ngIf="data.icon || data.type">
          <mat-icon [ngClass]="iconClass">{{ displayIcon }}</mat-icon>
        </div>

        <h2 class="dialog-title">{{ data.title }}</h2>

        <p class="dialog-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button
          mat-button
          type="button"
          (click)="onCancel()"
          class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>

        <button
          mat-raised-button
          type="button"
          [color]="confirmButtonColor"
          (click)="onConfirm()"
          class="confirm-button">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
      max-width: 500px;
    }

    .dialog-content {
      text-align: center;
      padding: 24px;
    }

    .dialog-icon {
      margin-bottom: 16px;
    }

    .dialog-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .dialog-icon .warning {
      color: #ff9800;
    }

    .dialog-icon .danger {
      color: #f44336;
    }

    .dialog-icon .info {
      color: #2196f3;
    }

    .dialog-icon .success {
      color: #4caf50;
    }

    .dialog-title {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-message {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.6);
    }

    .dialog-actions {
      padding: 16px 24px;
      justify-content: flex-end;
      gap: 8px;
    }

    .cancel-button {
      margin-right: 8px;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .dialog-title {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .dialog-message {
      color: rgba(255, 255, 255, 0.6);
    }

    /* Responsive design */
    @media (max-width: 599px) {
      .confirm-dialog {
        min-width: 280px;
      }

      .dialog-content {
        padding: 16px;
      }

      .dialog-actions {
        padding: 8px 16px 16px 16px;
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
        margin: 4px 0;
      }

      .cancel-button {
        margin-right: 0;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get displayIcon(): string {
    if (this.data.icon) {
      return this.data.icon;
    }

    switch (this.data.type) {
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  get iconClass(): string {
    return this.data.type || 'info';
  }

  get confirmButtonColor(): string {
    if (this.data.confirmColor) {
      return this.data.confirmColor;
    }

    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'success':
        return 'primary';
      default:
        return 'primary';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}