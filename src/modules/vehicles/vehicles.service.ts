import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createForUser(extlId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const owner = await this.usersRepo.findOne({ where: { extlId } });
    if (!owner) throw new NotFoundException('Owner not found');
    const vehicle = this.vehiclesRepo.create({ ...dto, owner });
    return this.vehiclesRepo.save(vehicle);
  }

  async listMine(extlId: string): Promise<Vehicle[]> {
    return this.vehiclesRepo
      .createQueryBuilder('v')
      .leftJoin('v.owner', 'owner')
      .addSelect(['owner.id', 'owner.extlId'])
      .where('owner.extlId = :extlId', { extlId })
      .orderBy('v.created_at', 'DESC')
      .getMany();
  }

  async hasVerifiedVehicle(extlId: string): Promise<boolean> {
    const count = await this.vehiclesRepo
      .createQueryBuilder('v')
      .leftJoin('v.owner', 'owner')
      .where('owner.extlId = :extlId', { extlId })
      .andWhere('v.verified = :verified', { verified: true })
      .getCount();
    return count > 0;
  }

  async removeIfOwner(
    vehicleId: string,
    ownerExtlId: string,
  ): Promise<{ ok: true }> {
    const v = await this.vehiclesRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.owner', 'owner')
      .where('v.id = :vehicleId', { vehicleId })
      .getOne();
    if (!v) throw new NotFoundException('Vehicle not found');
    if (v.owner?.extlId !== ownerExtlId)
      throw new NotFoundException('Vehicle not found');
    await this.vehiclesRepo.remove(v);
    return { ok: true };
  }

  async listByUserId(userId: string): Promise<Vehicle[]> {
    return this.vehiclesRepo
      .createQueryBuilder('v')
      .leftJoin('v.owner', 'owner')
      .addSelect(['owner.id', 'owner.extlId'])
      .where('owner.id = :userId', { userId })
      .orderBy('v.created_at', 'DESC')
      .getMany();
  }
}
