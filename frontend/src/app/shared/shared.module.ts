import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Third-party modules
import { NgxPaginationModule } from 'ngx-pagination';

// Shared components
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { StatusChipComponent } from './components/status-chip/status-chip.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';

// Shared pipes
import { TruncatePipe } from './pipes/truncate.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { HighlightPipe } from './pipes/highlight.pipe';
import { SafeUrlPipe } from './pipes/safe-url.pipe';

// Shared directives
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { AutofocusDirective } from './directives/autofocus.directive';
import { PermissionDirective } from './directives/permission.directive';

const ANGULAR_MATERIAL_MODULES = [
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatProgressBarModule,
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatTabsModule,
  MatExpansionModule,
  MatChipsModule,
  MatBadgeModule,
  MatTooltipModule,
  MatSlideToggleModule,
  MatSliderModule,
  MatAutocompleteModule
];

const SHARED_COMPONENTS = [
  ConfirmDialogComponent,
  LoadingSpinnerComponent,
  PageHeaderComponent,
  DataTableComponent,
  SearchBoxComponent,
  StatusChipComponent,
  AvatarComponent,
  EmptyStateComponent
];

const SHARED_PIPES = [
  TruncatePipe,
  TimeAgoPipe,
  FileSizePipe,
  HighlightPipe,
  SafeUrlPipe
];

const SHARED_DIRECTIVES = [
  ClickOutsideDirective,
  AutofocusDirective,
  PermissionDirective
];

/**
 * Shared module that contains common components, pipes, and directives
 * used across multiple feature modules.
 */
@NgModule({
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    ...SHARED_DIRECTIVES
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...ANGULAR_MATERIAL_MODULES,
    NgxPaginationModule
  ],
  exports: [
    // Angular modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,

    // Angular Material modules
    ...ANGULAR_MATERIAL_MODULES,

    // Third-party modules
    NgxPaginationModule,

    // Shared components, pipes, and directives
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    ...SHARED_DIRECTIVES
  ]
})
export class SharedModule { }