import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActiveBookingUnique1710000005000 implements MigrationInterface {
  name = 'ActiveBookingUnique1710000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_active_booking_trip_passenger
      ON bookings ("tripId", "passengerId")
      WHERE status IN ('pending','accepted');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS UQ_active_booking_trip_passenger;
    `);
  }
}
