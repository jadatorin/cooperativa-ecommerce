import { Injectable } from '@nestjs/common';

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

@Injectable()
export class MonitoringService {
  private readonly metrics: RequestMetric[] = [];
  private readonly maxMetrics = 100;

  recordRequest(metric: RequestMetric): void {
    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics() {
    const totalRequests = this.metrics.length;

    if (totalRequests === 0) {
      return {
        avgResponseTime: 0,
        errorRate: 0,
        totalRequests: 0,
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const errorCount = this.metrics.filter((m) => m.statusCode >= 400).length;

    return {
      avgResponseTime: Math.round(totalDuration / totalRequests),
      errorRate: Math.round((errorCount / totalRequests) * 100 * 100) / 100,
      totalRequests,
    };
  }

  getRecentMetrics(limit = 10): RequestMetric[] {
    return this.metrics.slice(-limit);
  }
}
