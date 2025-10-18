import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getByExtlId(extlId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { extlId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async me(extlId: string) {
    return this.getByExtlId(extlId);
  }

  async status(extlId: string) {
    const user = await this.getByExtlId(extlId);
    const vehiclesVerified = false; // will be computed in vehicles service if needed
    return {
      blocked: user.blocked,
      verified: user.verified,
      vehiclesVerified,
    };
  }

  async setBlocked(id: string, blocked: boolean) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.blocked = blocked;
    await this.usersRepo.save(user);
    return { ok: true, id: user.id, blocked: user.blocked };
  }
}
