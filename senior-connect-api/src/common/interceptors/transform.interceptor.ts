import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ServiceResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<ServiceResponse<T>, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res: ServiceResponse<T>) => ({
        success: true,
        message: res?.message ?? 'OK',
        data: res?.data ?? (null as T),
        ...(res?.meta ? { meta: res.meta } : {}),
      })),
    );
  }
}
