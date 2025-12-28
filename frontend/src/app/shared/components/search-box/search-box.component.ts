import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-search-box',
  template: `
    <mat-form-field appearance="outline" class="search-box">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        [placeholder]="placeholder"
        [(ngModel)]="searchValue"
        (keyup.enter)="onSearch()"
        (input)="onInput()">
      <button
        mat-icon-button
        matSuffix
        *ngIf="searchValue"
        (click)="clear()"
        matTooltip="Clear search">
        <mat-icon>clear</mat-icon>
      </button>
    </mat-form-field>
  `,
  styles: [`
    .search-box {
      width: 100%;
      max-width: 400px;
    }
  `]
})
export class SearchBoxComponent {
  @Input() placeholder: string = 'Search...';
  @Output() search = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  searchValue: string = '';

  onSearch(): void {
    this.search.emit(this.searchValue);
  }

  onInput(): void {
    if (!this.searchValue) {
      this.cleared.emit();
    }
  }

  clear(): void {
    this.searchValue = '';
    this.cleared.emit();
  }
}