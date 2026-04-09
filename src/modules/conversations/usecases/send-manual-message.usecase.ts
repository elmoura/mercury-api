import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AgentEntity } from '@modules/agents/entities/agent.entity';
import { OrganizationEntity } from '@modules/admin/organizations/entities/organization.entity';
import { Model, Types } from 'mongoose';
import { ContactEntity, ContactDocument } from '../entities/contact.entity';
import {
  ConversationDocument,
  ConversationEntity,
} from '../entities/conversation.entity';
import { MessageEntityDatasource } from '../datasources/message-entity.datasource';
import { WhatsappGraphService } from '../services/whatsapp-graph.service';
import { SendManualMessageOutputDto } from './dtos/send-manual-message-output.dto';

function isMongoDuplicateKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

@Injectable()
export class SendManualMessageUsecase {
  constructor(
    @InjectModel(ConversationEntity.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ContactEntity.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(OrganizationEntity.name)
    private readonly organizationModel: Model<OrganizationEntity>,
    @InjectModel(AgentEntity.name)
    private readonly agentModel: Model<AgentEntity>,
    private readonly messageDatasource: MessageEntityDatasource,
    private readonly whatsappGraph: WhatsappGraphService,
  ) {}

  async execute(input: {
    organizationId: string;
    conversationId: string;
    text: string;
    idempotencyKey: string;
  }): Promise<SendManualMessageOutputDto> {
    if (!Types.ObjectId.isValid(input.organizationId)) {
      throw new BadRequestException('Identificador de organização inválido.');
    }
    if (!Types.ObjectId.isValid(input.conversationId)) {
      throw new BadRequestException('Identificador de conversa inválido.');
    }

    const text = input.text.trim();
    const idempotencyKey = input.idempotencyKey.trim();
    if (!text) {
      throw new BadRequestException('Texto da mensagem não pode ser vazio.');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('idempotencyKey é obrigatório.');
    }

    const organizationId = new Types.ObjectId(input.organizationId);
    const conversationId = new Types.ObjectId(input.conversationId);

    const existing = await this.messageDatasource.findOutboundByIdempotency({
      organizationId,
      conversationId,
      idempotencyKey,
    });
    if (existing) {
      return {
        messageId: existing.metaMessageId,
        conversationId: existing.conversationId.toString(),
        direction: 'outbound',
        sentAt: existing.createdAt.toISOString(),
        idempotencyKey,
        deduplicated: true,
      };
    }

    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      organizationId,
    });
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const [organization, agent, contact] = await Promise.all([
      this.organizationModel.findById(organizationId),
      this.agentModel.findOne({
        _id: conversation.agentId,
        organizationId,
      }),
      this.contactModel.findOne({
        _id: conversation.contactId,
        organizationId,
      }),
    ]);

    if (!organization?.whatsappBusinessToken?.trim()) {
      throw new BadRequestException(
        'Organização sem integração WhatsApp Business ativa.',
      );
    }
    if (!agent) {
      throw new NotFoundException('Agente da conversa não encontrado.');
    }
    if (!agent.metaPhoneNumberId?.trim()) {
      throw new BadRequestException(
        'Agente sem phone_number_id da Meta configurado.',
      );
    }
    if (!contact?.waId?.trim()) {
      throw new BadRequestException('Contato da conversa sem WA ID válido.');
    }

    const { metaMessageId } = await this.whatsappGraph.sendText({
      accessToken: organization.whatsappBusinessToken,
      phoneNumberId: agent.metaPhoneNumberId,
      toWaId: contact.waId,
      body: text,
    });

    try {
      const created = await this.messageDatasource.createOutbound({
        organizationId,
        conversationId,
        agentId: conversation.agentId,
        text,
        metaMessageId,
        idempotencyKey,
      });
      return {
        messageId: created.metaMessageId,
        conversationId: created.conversationId.toString(),
        direction: 'outbound',
        sentAt: created.createdAt.toISOString(),
        idempotencyKey,
        deduplicated: false,
      };
    } catch (err: unknown) {
      if (isMongoDuplicateKey(err)) {
        const dedup = await this.messageDatasource.findOutboundByIdempotency({
          organizationId,
          conversationId,
          idempotencyKey,
        });
        if (dedup) {
          return {
            messageId: dedup.metaMessageId,
            conversationId: dedup.conversationId.toString(),
            direction: 'outbound',
            sentAt: dedup.createdAt.toISOString(),
            idempotencyKey,
            deduplicated: true,
          };
        }
      }
      throw err;
    }
  }
}
