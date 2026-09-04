import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Use type assertion to access switchTo method
    const ctx = context as any;
    const request = ctx.getRequest ? ctx.getRequest() : (ctx.switchTo ? ctx.switchTo().getRequest() : null);
    const user = request?.user;

    if (!user) {
      return false;
    }

    return user.role === 'admin';
  }
}