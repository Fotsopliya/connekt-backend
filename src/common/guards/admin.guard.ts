import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.role !== 'admin') throw new ForbiddenException('Admin only');
    return true;
  }
}
