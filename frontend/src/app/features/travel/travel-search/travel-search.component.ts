import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TravelSearchService } from '../../../core/services/travel-search.service';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TravelDocument } from '../../../core/models/travel.model';

@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-search.component.html',
  styleUrls: ['./travel-search.component.css']
})
export class TravelSearchComponent implements OnInit {
  results$: Observable<TravelDocument[]> = of([]);
  private searchTerm$ = new Subject<string>();

  constructor(private travelSearchService: TravelSearchService) { }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchTerm$.next(searchTerm);
  }

  ngOnInit(): void {
    this.results$ = this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.travelSearchService.search(term))
    );
  }
}
