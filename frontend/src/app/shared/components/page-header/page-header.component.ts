import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header">
      <h1>{{ title }}</h1>
      <p *ngIf="subtitle">{{ subtitle }}</p>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 500;
    }
    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}