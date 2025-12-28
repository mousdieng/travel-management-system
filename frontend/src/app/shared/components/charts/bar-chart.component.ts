import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface BarChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface BarChartConfig {
  labels: string[];
  datasets: BarChartDataset[];
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  horizontal?: boolean;
  height?: number;
  stacked?: boolean;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      @if (config.title) {
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ config.title }}</h3>
      }
      <div [style.height.px]="config.height || 300" class="relative">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      padding: 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    canvas {
      max-height: 100%;
    }
  `]
})
export class BarChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) config: BarChartConfig = {
    labels: [],
    datasets: [],
    horizontal: false
  };

  private chart?: Chart;

  ngOnInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartType = this.config.horizontal ? 'bar' : 'bar';
    const indexAxis = this.config.horizontal ? 'y' : 'x';

    const chartConfig: ChartConfiguration<'bar'> = {
      type: chartType,
      data: {
        labels: this.config.labels,
        datasets: this.config.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.backgroundColor || this.getDefaultBackgroundColors(dataset.data.length, index),
          borderColor: dataset.borderColor || this.getDefaultBorderColors(dataset.data.length, index),
          borderWidth: dataset.borderWidth ?? 1
        }))
      },
      options: {
        indexAxis: indexAxis as 'x' | 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.config.datasets.length > 1,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed.x;
                return value !== null ? `${label}: ${value.toLocaleString()}` : `${label}: N/A`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: this.config.stacked,
            title: {
              display: !!this.config.yAxisLabel,
              text: this.config.yAxisLabel || '',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            stacked: this.config.stacked,
            title: {
              display: !!this.config.xAxisLabel,
              text: this.config.xAxisLabel || '',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

  private getDefaultBackgroundColors(count: number, datasetIndex: number): string[] {
    const colorSets = [
      ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      ['rgba(99, 102, 241, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(244, 63, 94, 0.8)']
    ];

    const colors = colorSets[datasetIndex % colorSets.length];
    return Array(count).fill(null).map((_, i) => colors[i % colors.length]);
  }

  private getDefaultBorderColors(count: number, datasetIndex: number): string[] {
    const colorSets = [
      ['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(139, 92, 246)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
      ['rgb(99, 102, 241)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)', 'rgb(251, 146, 60)', 'rgb(244, 63, 94)']
    ];

    const colors = colorSets[datasetIndex % colorSets.length];
    return Array(count).fill(null).map((_, i) => colors[i % colors.length]);
  }

  updateChart(newConfig: BarChartConfig): void {
    this.config = newConfig;
    if (this.chart) {
      this.chart.destroy();
    }
    this.createChart();
  }
}
