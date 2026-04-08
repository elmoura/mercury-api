import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ConversationStatus {
  OPEN = 'open',
  WAITING = 'waiting',
  CLOSED = 'closed',
}

@Schema({ collection: 'conversations', timestamps: true })
export class ConversationEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  contactId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status: ConversationStatus;

  @Prop({ trim: true })
  lastMessagePreview?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ConversationDocument = HydratedDocument<ConversationEntity>;
export const ConversationSchema =
  SchemaFactory.createForClass(ConversationEntity);
