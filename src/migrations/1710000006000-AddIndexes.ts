import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1710000006000 implements MigrationInterface {
  name = 'AddIndexes1710000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_trips_departure_time ON trips (departure_time);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_trips_route_time ON trips (departure_city, arrival_city, departure_time);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_bookings_trip ON bookings ("tripId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_bookings_passenger ON bookings ("passengerId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_bookings_status ON bookings (status);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_bookings_created_at ON bookings (created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_messages_trip ON messages ("tripId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_messages_sender ON messages ("senderId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_messages_recipient ON messages ("recipientId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_messages_created_at ON messages (created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_messages_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_messages_recipient`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_messages_sender`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_messages_trip`);

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_bookings_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_bookings_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_bookings_passenger`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_bookings_trip`);

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_trips_route_time`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_trips_departure_time`);
  }
}
