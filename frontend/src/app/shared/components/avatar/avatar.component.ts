import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  template: `
    <div class="avatar" [ngClass]="sizeClass">
      <img
        *ngIf="src && !imageError"
        [src]="src"
        [alt]="name"
        (error)="onImageError()"
        class="avatar-image">

      <div
        *ngIf="!src || imageError"
        class="avatar-placeholder"
        [style.background-color]="backgroundColor">
        <span class="avatar-initials">{{ initials }}</span>
      </div>

      <div *ngIf="status" class="status-indicator" [ngClass]="status"></div>
    </div>
  `,
  styles: [`
    .avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .avatar-small {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }

    .avatar-medium {
      width: 48px;
      height: 48px;
      font-size: 16px;
    }

    .avatar-large {
      width: 64px;
      height: 64px;
      font-size: 20px;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
      text-transform: uppercase;
      border-radius: 50%;
    }

    .avatar-initials {
      line-height: 1;
    }

    .status-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      border-radius: 50%;
      border: 2px solid white;
    }

    .status-indicator.online {
      background-color: #4caf50;
    }

    .status-indicator.offline {
      background-color: #9e9e9e;
    }

    .status-indicator.away {
      background-color: #ff9800;
    }

    .status-indicator.busy {
      background-color: #f44336;
    }

    .avatar:hover {
      transform: scale(1.05);
      border-color: rgba(63, 81, 181, 0.2);
    }

    .avatar:focus {
      outline: 2px solid #3f51b5;
      outline-offset: 2px;
    }

    :host-context(.dark-theme) .status-indicator {
      border-color: #303030;
    }
  `]
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() name: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() status?: 'online' | 'offline' | 'away' | 'busy';

  imageError = false;

  get initials(): string {
    if (!this.name) return '?';

    const words = this.name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  get sizeClass(): string {
    return `avatar-${this.size}`;
  }

  get backgroundColor(): string {
    if (!this.name) return '#9e9e9e';

    // Generate a consistent color based on the name
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ff9800', '#ff5722', '#795548', '#607d8b'
    ];

    return colors[Math.abs(hash) % colors.length];
  }

  onImageError(): void {
    this.imageError = true;
  }
}