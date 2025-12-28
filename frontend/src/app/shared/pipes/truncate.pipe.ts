import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate pipe that shortens text to a specified length and adds ellipsis.
 *
 * Usage:
 * {{ text | truncate:50 }}
 * {{ text | truncate:100:'...' }}
 */
@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string,
    limit: number = 50,
    ellipsis: string = '...',
    wordBoundary: boolean = true
  ): string {
    if (!value) {
      return '';
    }

    if (value.length <= limit) {
      return value;
    }

    if (wordBoundary) {
      // Truncate at word boundary
      const truncated = value.substr(0, limit);
      const lastSpace = truncated.lastIndexOf(' ');

      if (lastSpace > 0) {
        return truncated.substr(0, lastSpace) + ellipsis;
      }
    }

    // Truncate at character limit
    return value.substr(0, limit) + ellipsis;
  }
}