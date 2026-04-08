import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { HttpLoggingInterceptor } from './http-logging.interceptor';

describe('HttpLoggingInterceptor', () => {
  const interceptor = new HttpLoggingInterceptor();

  function makeHttpContext(overrides: {
    path?: string;
    method?: string;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
    body?: unknown;
    originalUrl?: string;
    statusCode?: number;
  } = {}) {
    const req = {
      path: overrides.path ?? '/organizations/x',
      method: overrides.method ?? 'POST',
      params: overrides.params ?? { organizationId: '507f1f77bcf86cd799439011' },
      query: overrides.query ?? {},
      body: overrides.body ?? { name: 'a' },
      originalUrl: overrides.originalUrl ?? '/organizations/x',
      url: '/organizations/x',
    };
    const res = {
      statusCode: overrides.statusCode ?? 200,
    };
    return {
      getType: () => 'http' as const,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;
  }

  it('propaga o handler em pedidos HTTP', (done) => {
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };
    interceptor.intercept(makeHttpContext(), next).subscribe({
      next: (v) => {
        expect(v).toEqual({ ok: true });
        done();
      },
      error: done.fail,
    });
  });

  it('propaga erros do handler e finalize executa', (done) => {
    const next: CallHandler = {
      handle: () => throwError(() => new Error('boom')),
    };
    interceptor.intercept(makeHttpContext(), next).subscribe({
      next: () => done.fail('não devia emitir valor'),
      error: (e: Error) => {
        expect(e.message).toBe('boom');
        done();
      },
    });
  });

  it('em contexto não HTTP devolve o mesmo observable do handler', () => {
    const ctx = {
      getType: () => 'rpc',
    } as ExecutionContext;
    const inner$ = of(42);
    const next: CallHandler = {
      handle: () => inner$,
    };
    const out = interceptor.intercept(ctx, next);
    expect(out).toBe(inner$);
  });

  it('pedidos Swagger usam linha curta (sem lançar)', (done) => {
    const next: CallHandler = {
      handle: () => of(undefined),
    };
    const ctx = makeHttpContext({
      path: '/docs',
      method: 'GET',
      originalUrl: '/docs',
      body: undefined,
    });
    interceptor.intercept(ctx, next).subscribe({
      complete: () => done(),
      error: done.fail,
    });
  });
});
