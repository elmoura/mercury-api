import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'agents', timestamps: true })
export class AgentEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrganizationEntity', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  whatsappPhone: string;

  /** `phone_number_id` da Meta para o número Business ligado a este agente. */
  @Prop({ trim: true })
  metaPhoneNumberId?: string;

  @Prop({ required: true })
  prompt: string;

  createdAt: Date;
  updatedAt: Date;
}

export type AgentDocument = HydratedDocument<AgentEntity>;
export const AgentSchema = SchemaFactory.createForClass(AgentEntity);

// Um número de WhatsApp só pode existir uma vez por organização.
AgentSchema.index({ organizationId: 1, whatsappPhone: 1 }, { unique: true });
AgentSchema.index({ organizationId: 1 });
AgentSchema.index({ metaPhoneNumberId: 1 }, { unique: true, sparse: true });
