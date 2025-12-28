import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  template: `
    <div class="data-table">
      <mat-table [dataSource]="dataSource">
        <ng-content></ng-content>
      </mat-table>
    </div>
  `,
  styles: [`
    .data-table {
      width: 100%;
    }
  `]
})
export class DataTableComponent {
  @Input() dataSource: any[] = [];
}