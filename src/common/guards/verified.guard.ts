import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithUser } from '../types/request-with-user';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (!user.verified) throw new ForbiddenException('User is not verified');
    return true;
  }
}
