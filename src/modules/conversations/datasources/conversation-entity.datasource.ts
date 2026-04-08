import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ConversationEntity,
  ConversationStatus,
  type ConversationDocument,
} from '../entities/conversation.entity';
import {
  ContactEntity,
  type ContactDocument,
} from '../entities/contact.entity';

export type ConversationListRow = {
  conversation: ConversationDocument;
  contact: ContactDocument | null;
};

@Injectable()
export class ConversationEntityDatasource {
  constructor(
    @InjectModel(ConversationEntity.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ContactEntity.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async findByAgentPaginated(
    organizationId: Types.ObjectId,
    agentId: Types.ObjectId,
    params: {
      page: number;
      pageSize: number;
      status?: ConversationStatus;
    },
  ): Promise<{ rows: ConversationListRow[]; total: number }> {
    const filter: Record<string, unknown> = {
      organizationId,
      agentId,
    };
    if (params.status) {
      filter.status = params.status;
    }
    const skip = (params.page - 1) * params.pageSize;

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(params.pageSize)
        .exec(),
      this.conversationModel.countDocuments(filter).exec(),
    ]);

    const contactIds = [
      ...new Set(conversations.map((c) => c.contactId.toString())),
    ].map((id) => new Types.ObjectId(id));
    const contacts =
      contactIds.length > 0
        ? await this.contactModel
            .find({
              organizationId,
              _id: { $in: contactIds },
            })
            .exec()
        : [];
    const byId = new Map(contacts.map((c) => [c._id.toString(), c]));

    const rows: ConversationListRow[] = conversations.map((conversation) => ({
      conversation,
      contact: byId.get(conversation.contactId.toString()) ?? null,
    }));

    return { rows, total };
  }
}
