import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  template: `
    <mat-chip [ngClass]="getStatusClass()">
      <mat-icon *ngIf="showIcon">{{ getIcon() }}</mat-icon>
      {{ status }}
    </mat-chip>
  `,
  styles: [`
    .status-active { background-color: #4caf50; color: white; }
    .status-inactive { background-color: #ff9800; color: white; }
    .status-suspended { background-color: #f44336; color: white; }
    .status-pending { background-color: #2196f3; color: white; }
    mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  `]
})
export class StatusChipComponent {
  @Input() status: string = '';
  @Input() showIcon: boolean = true;

  getStatusClass(): string {
    return `status-${this.status.toLowerCase()}`;
  }

  getIcon(): string {
    switch (this.status.toLowerCase()) {
      case 'active': return 'check_circle';
      case 'inactive': return 'pause_circle';
      case 'suspended': return 'block';
      case 'pending': return 'schedule';
      default: return 'help';
    }
  }
}