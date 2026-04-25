import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ALL_ROLES, AppRole } from '../../modules/rbac/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const rawRole = request.headers['x-role'];
    const roleValue = Array.isArray(rawRole) ? rawRole[0] : rawRole;
    const role = typeof roleValue === 'string' ? roleValue.trim().toLowerCase() : undefined;

    if (!role || !ALL_ROLES.includes(role as AppRole)) {
      throw new ForbiddenException('Missing or invalid x-role header');
    }

    if (!requiredRoles.includes(role as AppRole)) {
      throw new ForbiddenException('Role mismatch: access denied');
    }

    return true;
  }
}
