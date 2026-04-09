import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MessageDocument,
  MessageEntity,
  MessageDirection,
} from '../entities/message.entity';

@Injectable()
export class MessageEntityDatasource {
  constructor(
    @InjectModel(MessageEntity.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findOutboundByIdempotency(params: {
    organizationId: Types.ObjectId;
    conversationId: Types.ObjectId;
    idempotencyKey: string;
  }): Promise<MessageDocument | null> {
    return this.messageModel
      .findOne({
        organizationId: params.organizationId,
        conversationId: params.conversationId,
        idempotencyKey: params.idempotencyKey,
        direction: MessageDirection.OUTBOUND,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async createOutbound(input: {
    organizationId: Types.ObjectId;
    conversationId: Types.ObjectId;
    agentId: Types.ObjectId;
    text: string;
    metaMessageId: string;
    idempotencyKey: string;
  }): Promise<MessageDocument> {
    return await this.messageModel.create({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      agentId: input.agentId,
      direction: MessageDirection.OUTBOUND,
      metaMessageId: input.metaMessageId,
      text: input.text,
      messageType: 'text',
      idempotencyKey: input.idempotencyKey,
    });
  }
}
