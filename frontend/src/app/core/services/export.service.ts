import { Injectable } from '@angular/core';

/**
 * ExportService
 *
 * Provides data export functionality for admin reports and analytics.
 * Supports CSV and PDF formats with customizable column configurations.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to CSV format
   *
   * @param data - Array of objects to export
   * @param filename - Name of the file (without extension)
   * @param columns - Optional column configuration { key: 'propertyName', label: 'Display Name' }
   */
  exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: Array<{ key: keyof T; label: string }>
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Determine columns - use provided config or infer from first object
    const columnConfig = columns || this.inferColumns(data[0]);

    // Create CSV header row
    const headers = columnConfig.map(col => this.escapeCSV(col.label)).join(',');

    // Create CSV data rows
    const rows = data.map(item =>
      columnConfig.map(col => {
        const value = item[col.key];
        return this.escapeCSV(this.formatValue(value));
      }).join(',')
    );

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Download file
    this.downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Export data to PDF format (basic implementation)
   * For production, consider using libraries like jsPDF or pdfmake
   *
   * @param data - Array of objects to export
   * @param filename - Name of the file (without extension)
   * @param title - Title for the PDF document
   * @param columns - Optional column configuration
   */
  exportToPDF<T extends Record<string, any>>(
    data: T[],
    filename: string,
    title: string,
    columns?: Array<{ key: keyof T; label: string }>
  ): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Determine columns
    const columnConfig = columns || this.inferColumns(data[0]);

    // Create HTML table
    const html = this.generatePDFHTML(data, title, columnConfig);

    // For now, we'll export as HTML that can be printed to PDF
    // In production, use a proper PDF library
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    link.click();
    window.URL.revokeObjectURL(url);

    // Show user instruction
    console.info('To save as PDF: Open the downloaded HTML file and use "Print to PDF"');
  }

  /**
   * Infer column configuration from object keys
   */
  private inferColumns<T extends Record<string, any>>(
    sample: T
  ): Array<{ key: keyof T; label: string }> {
    return Object.keys(sample).map(key => ({
      key: key as keyof T,
      label: this.formatLabel(key)
    }));
  }

  /**
   * Format object key to readable label
   * Examples: 'totalIncome' -> 'Total Income', 'managerName' -> 'Manager Name'
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // Insert space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Format value for CSV export
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate HTML for PDF export
   */
  private generatePDFHTML<T extends Record<string, any>>(
    data: T[],
    title: string,
    columns: Array<{ key: keyof T; label: string }>
  ): string {
    const headerRow = columns.map(col => `<th>${col.label}</th>`).join('');
    const dataRows = data.map(item =>
      `<tr>${columns.map(col => `<td>${this.formatValue(item[col.key])}</td>`).join('')}</tr>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            color: #333;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #3b82f6;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            border: 1px solid #ddd;
            padding: 10px;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          tr:hover {
            background-color: #e5e7eb;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
        <div class="footer">
          <p>To save as PDF: Use your browser's "Print to PDF" function (Ctrl+P or Cmd+P)</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Download file to user's device
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
