import { Request } from 'express';

export interface RequestUser {
  id?: string;
  extlId?: string;
  role?: 'user' | 'admin';
  blocked?: boolean;
  verified?: boolean;
}

export type RequestWithUser = Request & { user?: RequestUser };
