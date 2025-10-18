import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { UsersService } from './users.service';
import { SubmitUserKycDto } from './dto/submit-kyc.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequest } from '../verification/entities/verification-request.entity';
import type { RequestWithUser } from '../../common/types/request-with-user';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(VerificationRequest)
    private readonly vrRepo: Repository<VerificationRequest>,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    const headerExtl = req.headers['x-extl-id'] as string | undefined;
    return headerExtl || req.user?.extlId || '';
  }

  @Get('me')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  me(@Req() req: RequestWithUser) {
    const extlId = this.getExtlId(req);
    return this.usersService.me(extlId);
  }

  @Get('me/status')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  status(@Req() req: RequestWithUser) {
    const extlId = this.getExtlId(req);
    return this.usersService.status(extlId);
  }

  @Post('kyc')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  async submitKyc(@Req() req: RequestWithUser, @Body() dto: SubmitUserKycDto) {
    const extlId = this.getExtlId(req);
    const user = await this.usersService.getByExtlId(extlId);
    const vr = this.vrRepo.create({
      user,
      type: 'USER',
      status: 'pending',
      notes: dto.notes ?? null,
    });
    await this.vrRepo.save(vr);
    return { ok: true, requestId: vr.id };
  }
}
