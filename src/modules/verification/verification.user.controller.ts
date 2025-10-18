import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import type { RequestWithUser } from '../../common/types/request-with-user';
import { VerificationService } from './verification.service';
import { UsersService } from '../users/users.service';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, NotBlockedGuard)
@Controller('verification')
export class VerificationUserController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly usersService: UsersService,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Get('requests/mine')
  async listMine(@Req() req: RequestWithUser) {
    const extlId = this.getExtlId(req);
    const user = await this.usersService.getByExtlId(extlId);
    return this.verificationService.listMine(user.id);
  }
}
