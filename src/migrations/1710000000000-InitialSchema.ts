import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'extl_id', type: 'varchar', isUnique: true },
          { name: 'email', type: 'varchar', isUnique: true, isNullable: true },
          { name: 'avatar_url', type: 'varchar', isNullable: true },
          { name: 'role', type: 'varchar', default: "'user'" },
          { name: 'blocked', type: 'boolean', default: false },
          { name: 'verified', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_USERS_EXTL_ID',
            columnNames: ['extl_id'],
            isUnique: true,
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'ownerId', type: 'uuid', isNullable: false },
          { name: 'brand', type: 'varchar' },
          { name: 'model', type: 'varchar' },
          { name: 'plate_number', type: 'varchar' },
          { name: 'color', type: 'varchar', isNullable: true },
          { name: 'seats', type: 'int', default: 4 },
          { name: 'year', type: 'int', isNullable: true },
          { name: 'verified', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [{ name: 'UQ_VEHICLES_PLATE', columnNames: ['plate_number'] }],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'vehicles',
      new TableForeignKey({
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'verification_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'vehicleId', type: 'uuid', isNullable: true },
          { name: 'type', type: 'varchar' },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'reviewed_by_admin_id', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'verification_requests',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'verification_requests',
      new TableForeignKey({
        columnNames: ['vehicleId'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const vrTable = await queryRunner.getTable('verification_requests');
    if (vrTable) {
      for (const fk of vrTable.foreignKeys) {
        await queryRunner.dropForeignKey('verification_requests', fk);
      }
    }
    await queryRunner.dropTable('verification_requests', true);

    const vehiclesTable = await queryRunner.getTable('vehicles');
    if (vehiclesTable) {
      for (const fk of vehiclesTable.foreignKeys) {
        await queryRunner.dropForeignKey('vehicles', fk);
      }
    }
    await queryRunner.dropTable('vehicles', true);

    await queryRunner.dropTable('users', true);
  }
}
