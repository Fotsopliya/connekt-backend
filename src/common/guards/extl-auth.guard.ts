import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';
import type { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class ExtlAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const headerExtl = req.headers['x-extl-id'] as string | undefined;
    const extlId = headerExtl || req.user?.extlId;
    if (!extlId) throw new UnauthorizedException('Missing extl id');
    const user = await this.usersService.getByExtlId(extlId);
    req.user = user;
    return true;
  }
}
