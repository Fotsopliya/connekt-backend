import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class ExtendSchema1710000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // trips
    await queryRunner.createTable(
      new Table({
        name: 'trips',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'driverId', type: 'uuid', isNullable: false },
          { name: 'vehicleId', type: 'uuid', isNullable: false },
          { name: 'departure_city', type: 'varchar' },
          { name: 'arrival_city', type: 'varchar' },
          { name: 'departure_time', type: 'timestamp' },
          { name: 'seats_total', type: 'int', default: 4 },
          { name: 'seats_left', type: 'int', default: 4 },
          {
            name: 'price',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
          },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'validated', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_TRIPS_DRIVER',
            columnNames: ['driverId'],
          }),
          new TableIndex({
            name: 'IDX_TRIPS_VEHICLE',
            columnNames: ['vehicleId'],
          }),
          new TableIndex({
            name: 'IDX_TRIPS_DEPARTURE_TIME',
            columnNames: ['departure_time'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'trips',
      new TableForeignKey({
        columnNames: ['driverId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'trips',
      new TableForeignKey({
        columnNames: ['vehicleId'],
        referencedTableName: 'vehicles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // support_tickets
    await queryRunner.createTable(
      new Table({
        name: 'support_tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'subject', type: 'varchar' },
          { name: 'content', type: 'text' },
          { name: 'status', type: 'varchar', default: "'open'" },
          { name: 'admin_reply', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          new TableIndex({ name: 'IDX_SUPPORT_USER', columnNames: ['userId'] }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // messages
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'tripId', type: 'uuid', isNullable: false },
          { name: 'senderId', type: 'uuid', isNullable: false },
          { name: 'recipientId', type: 'uuid', isNullable: false },
          { name: 'content', type: 'text' },
          { name: 'is_read', type: 'boolean', default: false },
          { name: 'moderated', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_MESSAGES_TRIP',
            columnNames: ['tripId'],
          }),
          new TableIndex({
            name: 'IDX_MESSAGES_SENDER',
            columnNames: ['senderId'],
          }),
          new TableIndex({
            name: 'IDX_MESSAGES_RECIPIENT',
            columnNames: ['recipientId'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedTableName: 'trips',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['recipientId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // messages
    const messagesTable = await queryRunner.getTable('messages');
    if (messagesTable) {
      for (const fk of messagesTable.foreignKeys) {
        await queryRunner.dropForeignKey('messages', fk);
      }
    }
    await queryRunner.dropTable('messages', true);

    // support_tickets
    const supportTable = await queryRunner.getTable('support_tickets');
    if (supportTable) {
      for (const fk of supportTable.foreignKeys) {
        await queryRunner.dropForeignKey('support_tickets', fk);
      }
    }
    await queryRunner.dropTable('support_tickets', true);

    // trips
    const tripsTable = await queryRunner.getTable('trips');
    if (tripsTable) {
      for (const fk of tripsTable.foreignKeys) {
        await queryRunner.dropForeignKey('trips', fk);
      }
    }
    await queryRunner.dropTable('trips', true);
  }
}
