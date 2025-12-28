import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface PieChartConfig {
  labels: string[];
  data: number[];
  title?: string;
  backgroundColor?: string[];
  borderColor?: string[];
  type?: 'pie' | 'doughnut';
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

@Component({
  selector: 'app-pie-chart',
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
export class PieChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) config: PieChartConfig = {
    labels: [],
    data: [],
    type: 'pie',
    showLegend: true,
    showPercentage: true
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

    const chartType = this.config.type || 'pie';

    const chartConfig: ChartConfiguration<'pie' | 'doughnut'> = {
      type: chartType,
      data: {
        labels: this.config.labels,
        datasets: [{
          data: this.config.data,
          backgroundColor: this.config.backgroundColor || this.getDefaultBackgroundColors(this.config.data.length),
          borderColor: this.config.borderColor || this.getDefaultBorderColors(this.config.data.length),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.config.showLegend ?? true,
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  const dataset = data.datasets[0];
                  const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);

                  return data.labels.map((label, i) => {
                    const value = (dataset.data as number[])[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    const displayLabel = this.config.showPercentage
                      ? `${label} (${percentage}%)`
                      : label as string;

                    return {
                      text: displayLabel,
                      fillStyle: (dataset.backgroundColor as string[])[i],
                      strokeStyle: (dataset.borderColor as string[])[i],
                      lineWidth: 2,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
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
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((sum: number, val) => sum + (val as number), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

  private getDefaultBackgroundColors(count: number): string[] {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(139, 92, 246, 0.8)',   // purple
      'rgba(245, 158, 11, 0.8)',   // orange
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(20, 184, 166, 0.8)',   // teal
      'rgba(251, 146, 60, 0.8)',   // amber
      'rgba(99, 102, 241, 0.8)',   // indigo
      'rgba(34, 197, 94, 0.8)'     // lime
    ];
    return Array(count).fill(null).map((_, i) => colors[i % colors.length]);
  }

  private getDefaultBorderColors(count: number): string[] {
    const colors = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(139, 92, 246)',
      'rgb(245, 158, 11)',
      'rgb(239, 68, 68)',
      'rgb(236, 72, 153)',
      'rgb(20, 184, 166)',
      'rgb(251, 146, 60)',
      'rgb(99, 102, 241)',
      'rgb(34, 197, 94)'
    ];
    return Array(count).fill(null).map((_, i) => colors[i % colors.length]);
  }

  updateChart(newConfig: PieChartConfig): void {
    this.config = newConfig;
    if (this.chart) {
      this.chart.destroy();
    }
    this.createChart();
  }
}
