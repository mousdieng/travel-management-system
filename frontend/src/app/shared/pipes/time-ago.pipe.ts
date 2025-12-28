import { Pipe, PipeTransform } from '@angular/core';

/**
 * Time ago pipe that converts dates to relative time strings.
 *
 * Usage:
 * {{ date | timeAgo }}
 * {{ timestamp | timeAgo }}
 */
@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) {
      return 'in the future';
    }

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);

      if (count >= 1) {
        if (count === 1) {
          return `1 ${interval.label} ago`;
        } else {
          return `${count} ${interval.label}s ago`;
        }
      }
    }

    return 'just now';
  }
}