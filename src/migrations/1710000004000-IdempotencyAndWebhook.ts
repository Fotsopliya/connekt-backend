import { MigrationInterface, QueryRunner } from 'typeorm';

export class IdempotencyAndWebhook1710000004000 implements MigrationInterface {
  name = 'IdempotencyAndWebhook1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id SERIAL PRIMARY KEY,
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        method VARCHAR(16) NOT NULL,
        path TEXT NOT NULL,
        extl_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used_at TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(64) NOT NULL,
        event_id VARCHAR(255) NOT NULL,
        received_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(provider, event_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS idempotency_keys`);
  }
}
