import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class NotBlockedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.blocked) throw new ForbiddenException('User is blocked');
    return true;
  }
}
