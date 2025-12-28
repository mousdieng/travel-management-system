import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogConfig, DialogResult } from './dialog.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent implements OnInit {
  public isVisible = signal(false);
  public config = signal<DialogConfig | null>(null);
  private resultSubject: Subject<DialogResult> | null = null;

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.dialogService.dialogState$.subscribe(({ config, result }) => {
      this.config.set(config);
      this.resultSubject = result;
      this.isVisible.set(true);
    });
  }

  public getIcon(): string {
    const type = this.config()?.type;
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  }

  public getIconColor(): string {
    const type = this.config()?.type;
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'confirm':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  public onConfirm(): void {
    if (this.resultSubject) {
      this.resultSubject.next({ confirmed: true });
      this.resultSubject.complete();
    }
    this.close();
  }

  public onCancel(): void {
    if (this.resultSubject) {
      this.resultSubject.next({ confirmed: false });
      this.resultSubject.complete();
    }
    this.close();
  }

  private close(): void {
    this.isVisible.set(false);
    this.resultSubject = null;
  }

  public onBackdropClick(event: MouseEvent): void {
    // Close on backdrop click
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
