import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface LineChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
}

export interface LineChartConfig {
  labels: string[];
  datasets: LineChartDataset[];
  title?: string;
  yAxisLabel?: string;
  height?: number;
}

@Component({
  selector: 'app-line-chart',
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
export class LineChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) config: LineChartConfig = {
    labels: [],
    datasets: []
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

    const chartConfig: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.config.labels,
        datasets: this.config.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.borderColor || this.getDefaultColor(index),
          backgroundColor: dataset.backgroundColor || this.getDefaultBackgroundColor(index),
          tension: dataset.tension ?? 0.4,
          fill: dataset.fill ?? false,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
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
            grid: {
              display: false
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

  private getDefaultColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#f59e0b', // orange
      '#ef4444', // red
      '#ec4899'  // pink
    ];
    return colors[index % colors.length];
  }

  private getDefaultBackgroundColor(index: number): string {
    const colors = [
      'rgba(59, 130, 246, 0.1)',
      'rgba(16, 185, 129, 0.1)',
      'rgba(139, 92, 246, 0.1)',
      'rgba(245, 158, 11, 0.1)',
      'rgba(239, 68, 68, 0.1)',
      'rgba(236, 72, 153, 0.1)'
    ];
    return colors[index % colors.length];
  }

  updateChart(newConfig: LineChartConfig): void {
    this.config = newConfig;
    if (this.chart) {
      this.chart.destroy();
    }
    this.createChart();
  }
}
