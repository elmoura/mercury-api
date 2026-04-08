import { Injectable, Logger } from '@nestjs/common';
import { AgentEntityDatasource } from '@modules/agents/datasources/agent-entity.datasource';
import {
  MESSAGE_INBOUND_SCHEMA_VERSION,
  type MessageInboundV1,
} from '@/shared/contracts/message-inbound.v1';
import { RabbitMqPublisherService } from '@/shared/rabbitmq/rabbitmq-publisher.service';
import {
  extractTextFromMetaMessage,
  parseMetaWhatsappWebhook,
} from '../lib/parse-meta-whatsapp-webhook';
import { v4 as uuidv4 } from 'uuid';

export type ReceiveWhatsappMessageResult = {
  published: number;
  skippedNoAgent: number;
  slices: number;
};

@Injectable()
export class ReceiveWhatsappMessageUsecase {
  private readonly logger = new Logger(ReceiveWhatsappMessageUsecase.name);

  constructor(
    private readonly agentDatasource: AgentEntityDatasource,
    private readonly rabbitMqPublisher: RabbitMqPublisherService,
  ) {}

  async execute(body: unknown): Promise<ReceiveWhatsappMessageResult> {
    const slices = parseMetaWhatsappWebhook(body);
    let published = 0;
    let skippedNoAgent = 0;

    for (const slice of slices) {
      const metaPhoneNumberId = slice.metadata.phone_number_id;
      const agent =
        await this.agentDatasource.findByMetaPhoneNumberId(metaPhoneNumberId);
      if (!agent) {
        skippedNoAgent += 1;
        this.logger.warn(
          `Sem agente para phone_number_id=${metaPhoneNumberId}; ignorando.`,
        );
        continue;
      }

      const fromWaId =
        typeof slice.message.from === 'string' ? slice.message.from : '';
      const metaMessageId =
        typeof slice.message.id === 'string' ? slice.message.id : '';
      if (!fromWaId || !metaMessageId) {
        this.logger.warn('Mensagem Meta sem from ou id; ignorando.');
        continue;
      }

      const messageType =
        typeof slice.message.type === 'string' ? slice.message.type : 'unknown';
      const text = extractTextFromMetaMessage(slice.message);
      const ts =
        typeof slice.message.timestamp === 'string'
          ? slice.message.timestamp
          : String(slice.message.timestamp ?? '');
      const timestampIso =
        ts && /^\d+$/.test(ts)
          ? new Date(Number(ts) * 1000).toISOString()
          : new Date().toISOString();

      let contactName: string | undefined;
      const wa = slice.contacts?.find((c) => c.wa_id === fromWaId);
      if (wa?.profile?.name) {
        contactName = wa.profile.name;
      }

      const event: MessageInboundV1 = {
        schemaVersion: MESSAGE_INBOUND_SCHEMA_VERSION,
        eventId: uuidv4(),
        organizationId: agent.organizationId.toString(),
        agentId: agent._id.toString(),
        metaPhoneNumberId,
        metaMessageId,
        fromWaId,
        contactName,
        timestampIso,
        messageType,
        text,
        rawMessage: slice.message,
      };

      await this.rabbitMqPublisher.publishInboundJson(event);
      published += 1;
    }

    return { published, skippedNoAgent, slices: slices.length };
  }
}
