import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class BookingsSchema1710000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bookings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tripId', type: 'uuid', isNullable: false },
          { name: 'passengerId', type: 'uuid', isNullable: false },
          { name: 'seats', type: 'int', default: 1 },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_BOOKINGS_TRIP',
            columnNames: ['tripId'],
          }),
          new TableIndex({
            name: 'IDX_BOOKINGS_PASSENGER',
            columnNames: ['passengerId'],
          }),
          new TableIndex({
            name: 'IDX_BOOKINGS_CREATED_AT',
            columnNames: ['created_at'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'bookings',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedTableName: 'trips',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bookings',
      new TableForeignKey({
        columnNames: ['passengerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('bookings');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('bookings', fk);
      }
    }
    await queryRunner.dropTable('bookings', true);
  }
}
