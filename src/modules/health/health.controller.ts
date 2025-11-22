import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('/health')
  health() {
    return { ok: true };
  }

  @Get('/ready')
  async ready() {
    try {
      // simple DB ping
      await this.dataSource.query('SELECT 1');
      return { ok: true, db: 'up' };
    } catch {
      return { ok: false, db: 'down' };
    }
  }
}
