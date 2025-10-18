import { MigrationInterface, QueryRunner } from 'typeorm';

export class TripSeatsCheck1710000003000 implements MigrationInterface {
  name = 'TripSeatsCheck1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "CHK_TRIPS_SEATS_NONNEG" CHECK (seats_left >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "CHK_TRIPS_SEATS_BOUND" CHECK (seats_left <= seats_total)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT IF EXISTS "CHK_TRIPS_SEATS_BOUND"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT IF EXISTS "CHK_TRIPS_SEATS_NONNEG"`,
    );
  }
}
