import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const extlId = process.env.DEFAULT_ADMIN_EXTL_ID;
    if (!extlId) return;

    const email = process.env.DEFAULT_ADMIN_EMAIL ?? null;
    const avatarUrl = process.env.DEFAULT_ADMIN_AVATAR_URL ?? null;
    await this.usersRepo.upsert(
      {
        extlId,
        email,
        avatarUrl,
        role: 'admin',
        verified: true,
        blocked: false,
      },
      {
        conflictPaths: ['extlId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    this.logger.log(`Ensured default admin exists: ${extlId}`);
  }
}
