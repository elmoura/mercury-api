import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'client_secret',
]);

function shouldRedactKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower)) {
    return true;
  }
  if (lower.includes('password')) {
    return true;
  }
  if (lower.includes('token') && lower !== 'organizationid') {
    return true;
  }
  return false;
}

/** Cópia superficial com valores sensíveis substituídos (body/query). */
function shallowRedact(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => shallowRedact(item));
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (shouldRedactKey(k)) {
        out[k] = '[redacted]';
      } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = shallowRedact(v) as Record<string, unknown>;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return input;
}

function isSwaggerNoisePath(path: string): boolean {
  return (
    path === '/docs' ||
    path === '/docs-json' ||
    path.startsWith('/docs/')
  );
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const path = req.path ?? '';
    const start = Date.now();
    const label = `${req.method} ${req.originalUrl ?? req.url}`;

    if (isSwaggerNoisePath(path)) {
      return next.handle().pipe(
        finalize(() => {
          const ms = Date.now() - start;
          this.logger.log(`${label} -> ${res.statusCode} ${ms}ms`);
        }),
      );
    }

    const params = { ...req.params };
    const query = shallowRedact(req.query) as Record<string, unknown>;
    const body =
      req.body &&
      typeof req.body === 'object' &&
      !Buffer.isBuffer(req.body)
        ? shallowRedact(req.body)
        : req.body;

    this.logger.log(
      `--> ${label} ${JSON.stringify({ params, query, body })}`,
    );

    return next.handle().pipe(
      finalize(() => {
        const ms = Date.now() - start;
        this.logger.log(`<-- ${label} ${res.statusCode} ${ms}ms`);
      }),
    );
  }
}
