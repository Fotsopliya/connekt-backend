import { Controller, Get, Header } from '@nestjs/common';
import client from 'prom-client';

// Register default metrics once
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Example custom metrics
export const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000],
});

register.registerMetric(httpRequestDurationMs);

@Controller()
export class MetricsController {
  @Get('/metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return register.metrics();
  }
}
