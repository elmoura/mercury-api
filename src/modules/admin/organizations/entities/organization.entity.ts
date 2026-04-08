import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum OrganizationPlanTypes {
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

@Schema({ collection: 'organizations', timestamps: true })
export class OrganizationEntity {
  @Prop({ required: true })
  name: string;

  @Prop()
  ownerId?: string;

  @Prop({
    required: true,
    enum: OrganizationPlanTypes,
  })
  planType: OrganizationPlanTypes;

  @Prop()
  facebookBusinessId?: string;

  /** Token de acesso Meta (Graph / WhatsApp Cloud API); nunca expor em DTOs de leitura. */
  @Prop()
  whatsappBusinessToken?: string;

  /** Valor de `token_type` na última troca OAuth (ex.: bearer). */
  @Prop()
  metaTokenType?: string;

  @Prop()
  tokenExpiresAt?: Date;

  @Prop()
  tokenLastRefreshedAt?: Date;

  @Prop({ type: [String], default: [] })
  whatsappNumbers?: string[];
}

export type OrganizationDocument = HydratedDocument<OrganizationEntity>;
export const OrganizationSchema =
  SchemaFactory.createForClass(OrganizationEntity);

/** Suporta jobs de refresh (ex.: janela por `tokenExpiresAt`). */
OrganizationSchema.index({ tokenExpiresAt: 1 }, { sparse: true });
