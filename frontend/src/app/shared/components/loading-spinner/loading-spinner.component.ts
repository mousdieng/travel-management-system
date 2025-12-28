import { Component, Input } from '@angular/core';

/**
 * Loading spinner component that displays a customizable loading indicator.
 * Can be used throughout the application for consistent loading states.
 */
@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="loading-container" [ngClass]="containerClass">
      <mat-spinner
        [diameter]="diameter"
        [strokeWidth]="strokeWidth"
        [color]="color">
      </mat-spinner>

      <div class="loading-text" *ngIf="text" [ngClass]="textClass">
        {{ text }}
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .loading-container.overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      z-index: 1000;
    }

    .loading-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      z-index: 9999;
    }

    .loading-text {
      margin-top: 16px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }

    .loading-text.large {
      font-size: 16px;
    }

    .loading-text.small {
      font-size: 12px;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .loading-container.overlay,
    :host-context(.dark-theme) .loading-container.fullscreen {
      background: rgba(0, 0, 0, 0.8);
    }

    :host-context(.dark-theme) .loading-text {
      color: #ccc;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() diameter: number = 40;
  @Input() strokeWidth: number = 4;
  @Input() color: string = 'primary';
  @Input() text: string = '';
  @Input() overlay: boolean = false;
  @Input() fullscreen: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get containerClass(): string {
    const classes = [];

    if (this.overlay) classes.push('overlay');
    if (this.fullscreen) classes.push('fullscreen');

    return classes.join(' ');
  }

  get textClass(): string {
    return this.size;
  }
}