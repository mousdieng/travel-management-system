import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
}

export interface FilterConfig {
  showSearch?: boolean;
  searchPlaceholder?: string;
  showDateRange?: boolean;
  dateRangeLabel?: string;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'multiselect';
    options: FilterOption[];
    placeholder?: string;
  }>;
}

export interface FilterValues {
  search?: string;
  dateRange?: DateRangeFilter;
  [key: string]: any;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
        @if (hasActiveFilters()) {
          <button
            (click)="clearAllFilters()"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear All
          </button>
        }
      </div>

      <form [formGroup]="filterForm" class="space-y-4">
        <!-- Search Input -->
        @if (config().showSearch) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ config().searchPlaceholder || 'Search' }}
            </label>
            <input
              type="text"
              formControlName="search"
              [placeholder]="config().searchPlaceholder || 'Search...'"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        }

        <!-- Date Range Filter -->
        @if (config().showDateRange) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ config().dateRangeLabel || 'Date Range' }}
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="date"
                  formControlName="startDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="Start Date"
                />
              </div>
              <div>
                <input
                  type="date"
                  formControlName="endDate"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>
        }

        <!-- Dynamic Filters -->
        @for (filter of config().filters || []; track filter.key) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ filter.label }}
            </label>

            @if (filter.type === 'select') {
              <select
                [formControlName]="filter.key"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">{{ filter.placeholder || 'All' }}</option>
                @for (option of filter.options; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            }

            @if (filter.type === 'multiselect') {
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                @for (option of filter.options; track option.value) {
                  <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      [value]="option.value"
                      (change)="onMultiSelectChange(filter.key, option.value, $event)"
                      [checked]="isSelected(filter.key, option.value)"
                      class="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span class="text-sm text-gray-700">{{ option.label }}</span>
                  </label>
                }
              </div>
            }
          </div>
        }
      </form>

      <!-- Active Filters Display -->
      @if (hasActiveFilters()) {
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap gap-2">
            <span class="text-xs font-medium text-gray-500">Active Filters:</span>
            @for (filter of getActiveFilterLabels(); track filter.key) {
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {{ filter.label }}
                <button
                  (click)="removeFilter(filter.key)"
                  class="ml-1 hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    input[type="date"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
    }
  `]
})
export class FilterPanelComponent implements OnInit, OnDestroy {
  @Input() config = signal<FilterConfig>({
    showSearch: true,
    showDateRange: false,
    filters: []
  });
  @Output() filterChange = new EventEmitter<FilterValues>();

  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private multiSelectValues = new Map<string, Set<string | number>>();

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const formControls: any = {};

    if (this.config().showSearch) {
      formControls['search'] = new FormControl('');
    }

    if (this.config().showDateRange) {
      formControls['startDate'] = new FormControl('');
      formControls['endDate'] = new FormControl('');
    }

    this.config().filters?.forEach(filter => {
      if (filter.type === 'multiselect') {
        this.multiSelectValues.set(filter.key, new Set());
      }
      formControls[filter.key] = new FormControl(filter.type === 'multiselect' ? [] : '');
    });

    this.filterForm = new FormGroup(formControls);
  }

  private setupFormSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.emitFilterChange();
      });
  }

  private emitFilterChange(): void {
    const values = this.filterForm.value;
    const filterValues: FilterValues = {};

    if (this.config().showSearch && values.search) {
      filterValues.search = values.search;
    }

    if (this.config().showDateRange) {
      if (values.startDate || values.endDate) {
        filterValues.dateRange = {
          startDate: values.startDate || null,
          endDate: values.endDate || null
        };
      }
    }

    this.config().filters?.forEach(filter => {
      if (filter.type === 'multiselect') {
        const selectedValues = Array.from(this.multiSelectValues.get(filter.key) || []);
        if (selectedValues.length > 0) {
          filterValues[filter.key] = selectedValues;
        }
      } else if (values[filter.key]) {
        filterValues[filter.key] = values[filter.key];
      }
    });

    this.filterChange.emit(filterValues);
  }

  onMultiSelectChange(filterKey: string, value: string | number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const selectedSet = this.multiSelectValues.get(filterKey) || new Set();

    if (checkbox.checked) {
      selectedSet.add(value);
    } else {
      selectedSet.delete(value);
    }

    this.multiSelectValues.set(filterKey, selectedSet);
    this.filterForm.patchValue({ [filterKey]: Array.from(selectedSet) });
  }

  isSelected(filterKey: string, value: string | number): boolean {
    return this.multiSelectValues.get(filterKey)?.has(value) || false;
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;

    if (this.config().showSearch && values.search?.trim()) {
      return true;
    }

    if (this.config().showDateRange && (values.startDate || values.endDate)) {
      return true;
    }

    return this.config().filters?.some(filter => {
      if (filter.type === 'multiselect') {
        return (this.multiSelectValues.get(filter.key)?.size || 0) > 0;
      }
      return values[filter.key] !== '' && values[filter.key] !== null;
    }) || false;
  }

  getActiveFilterLabels(): Array<{ key: string; label: string }> {
    const labels: Array<{ key: string; label: string }> = [];
    const values = this.filterForm.value;

    if (this.config().showSearch && values.search?.trim()) {
      labels.push({ key: 'search', label: `Search: "${values.search}"` });
    }

    if (this.config().showDateRange) {
      if (values.startDate || values.endDate) {
        const dateLabel = values.startDate && values.endDate
          ? `${values.startDate} to ${values.endDate}`
          : values.startDate
          ? `From ${values.startDate}`
          : `Until ${values.endDate}`;
        labels.push({ key: 'dateRange', label: dateLabel });
      }
    }

    this.config().filters?.forEach(filter => {
      if (filter.type === 'multiselect') {
        const selectedCount = this.multiSelectValues.get(filter.key)?.size || 0;
        if (selectedCount > 0) {
          labels.push({ key: filter.key, label: `${filter.label} (${selectedCount})` });
        }
      } else if (values[filter.key]) {
        const option = filter.options.find(opt => opt.value === values[filter.key]);
        if (option) {
          labels.push({ key: filter.key, label: `${filter.label}: ${option.label}` });
        }
      }
    });

    return labels;
  }

  removeFilter(key: string): void {
    if (key === 'search') {
      this.filterForm.patchValue({ search: '' });
    } else if (key === 'dateRange') {
      this.filterForm.patchValue({ startDate: '', endDate: '' });
    } else {
      const filter = this.config().filters?.find(f => f.key === key);
      if (filter?.type === 'multiselect') {
        this.multiSelectValues.set(key, new Set());
      }
      this.filterForm.patchValue({ [key]: filter?.type === 'multiselect' ? [] : '' });
    }
  }

  clearAllFilters(): void {
    this.multiSelectValues.forEach((_, key) => {
      this.multiSelectValues.set(key, new Set());
    });
    this.filterForm.reset();
  }
}
