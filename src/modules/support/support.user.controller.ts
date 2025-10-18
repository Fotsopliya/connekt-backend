import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import type { RequestWithUser } from '../../common/types/request-with-user';
import { SupportService } from './support.service';
import { UsersService } from '../users/users.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, NotBlockedGuard)
@Controller('support')
export class SupportUserController {
  constructor(
    private readonly supportService: SupportService,
    private readonly usersService: UsersService,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Post('tickets')
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateSupportTicketDto,
  ) {
    const extlId = this.getExtlId(req);
    const user = await this.usersService.getByExtlId(extlId);
    return this.supportService.create(user, dto.subject, dto.content);
  }

  @Get('tickets/mine')
  listMine(
    @Req() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const extlId = this.getExtlId(req);
    return this.usersService
      .getByExtlId(extlId)
      .then((u) =>
        this.supportService.listMine(
          u.id,
          parseInt(page, 10),
          parseInt(limit, 10),
        ),
      );
  }

  @Delete('tickets/:id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const user = await this.usersService.getByExtlId(extlId);
    return this.supportService.deleteIfOwner(id, user.id);
  }
}
