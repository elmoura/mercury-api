import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConversationEntityDatasource } from '../datasources/conversation-entity.datasource';
import { InvalidDataException } from '@modules/agents/exceptions/invalid-data.exception';
import { ListConversationsQueryDto } from './dtos/list-conversations-query.dto';
import {
  ConversationSummaryOutputDto,
  ListConversationsOutputDto,
} from './dtos/conversation-summary-output.dto';

@Injectable()
export class ListConversationsUsecase {
  constructor(private readonly datasource: ConversationEntityDatasource) {}

  async execute(
    organizationId: string,
    query: ListConversationsQueryDto,
  ): Promise<ListConversationsOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }
    if (!Types.ObjectId.isValid(query.agentId)) {
      throw new InvalidDataException('Identificador de agente inválido.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const orgObjectId = new Types.ObjectId(organizationId);
    const agentObjectId = new Types.ObjectId(query.agentId);

    const { rows, total } = await this.datasource.findByAgentPaginated(
      orgObjectId,
      agentObjectId,
      {
        page,
        pageSize,
        status: query.status,
      },
    );

    const items: ConversationSummaryOutputDto[] = rows.map(
      ({ conversation, contact }) => ({
        _id: conversation._id.toString(),
        organizationId: conversation.organizationId.toString(),
        agentId: conversation.agentId.toString(),
        contactId: conversation.contactId.toString(),
        contactDisplayName: contact?.displayName ?? null,
        contactWaId: contact?.waId ?? null,
        status: conversation.status,
        lastMessagePreview: conversation.lastMessagePreview ?? null,
        updatedAt: conversation.updatedAt.toISOString(),
      }),
    );

    return { items, page, pageSize, total };
  }
}
