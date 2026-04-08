import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { config } from '@/config/config';
import { WHATSAPP_INBOUND_CLIENT } from './whatsapp-inbound.constants';
import { firstValueFrom, isObservable } from 'rxjs';
import type { Observable } from 'rxjs';

/** Padrão de evento alinhado ao consumidor Nest/heracles (payload em `data`). */
export const WHATSAPP_INBOUND_EVENT_PATTERN = 'message.inbound.v1' as const;

/**
 * Publicação via `@nestjs/microservices` (Transport.RMQ) na exchange fanout.
 * O corpo na fila segue o envelope Nest `{ pattern, data }` (deserializado no consumer).
 */
@Injectable()
export class RabbitMqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisherService.name);

  constructor(
    @Inject(WHATSAPP_INBOUND_CLIENT) private readonly client: ClientProxy,
  ) {}

  get enabled(): boolean {
    return Boolean(config.rabbitmq.url?.trim());
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(
        'RABBITMQ_URL não definido — eventos inbound não serão publicados.',
      );
      return;
    }
    try {
      await this.awaitClientConnect();
      this.logger.log(
        `RabbitMQ (Nest ClientProxy RMQ): exchange fanout "${config.rabbitmq.inboundExchange}".`,
      );
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const closed = this.client.close();
    await this.awaitMaybeObservable(closed);
  }

  private async awaitClientConnect(): Promise<void> {
    const c = this.client.connect();
    await this.awaitMaybeObservable(c);
  }

  private async awaitMaybeObservable(
    v: Promise<unknown> | Observable<unknown>,
  ): Promise<void> {
    if (isObservable(v)) {
      await firstValueFrom(v);
      return;
    }
    await v;
  }

  async publishInboundJson(payload: object): Promise<void> {
    if (!this.enabled) {
      return;
    }
    await firstValueFrom(
      this.client.emit(WHATSAPP_INBOUND_EVENT_PATTERN, payload),
    );
  }
}
