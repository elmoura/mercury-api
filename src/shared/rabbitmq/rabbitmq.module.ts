import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { config } from '@/config/config';
import { WHATSAPP_INBOUND_CLIENT } from './whatsapp-inbound.constants';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: WHATSAPP_INBOUND_CLIENT,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.rabbitmq.url],
            /** Usado como nome da exchange em modo fanout (ver ClientRMQ). */
            queue: config.rabbitmq.inboundExchange,
            exchange: config.rabbitmq.inboundExchange,
            exchangeType: 'fanout',
            persistent: true,
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMqPublisherService],
  exports: [RabbitMqPublisherService],
})
export class RabbitMqModule {}
