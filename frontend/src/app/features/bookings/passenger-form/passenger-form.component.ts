import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PassengerType } from '../../../core/models/booking.model';

@Component({
  selector: 'app-passenger-form',
  templateUrl: './passenger-form.component.html',
  styleUrls: ['./passenger-form.component.scss']
})
export class PassengerFormComponent implements OnInit {
  @Input() passengerForm!: FormGroup;
  @Input() passengerIndex: number = 0;

  passengerTypes = [
    { value: PassengerType.ADULT, label: 'Adult', icon: 'person', description: 'Age 18+' },
    { value: PassengerType.CHILD, label: 'Child', icon: 'child_care', description: 'Age 2-17' },
    { value: PassengerType.INFANT, label: 'Infant', icon: 'baby_changing_station', description: 'Age 0-1' },
    { value: PassengerType.SENIOR, label: 'Senior', icon: 'elderly', description: 'Age 65+' }
  ];

  nationalities: string[] = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Japan',
    'China',
    'India',
    'Brazil',
    'Mexico',
    'Other'
  ];

  constructor() {}

  ngOnInit(): void {
    if (!this.passengerForm) {
      throw new Error('passengerForm is required for PassengerFormComponent');
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.passengerForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }

    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }

    return '';
  }
}
