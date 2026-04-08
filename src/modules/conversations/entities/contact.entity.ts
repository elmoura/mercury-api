import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'contacts', timestamps: true })
export class ContactEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  waId: string;

  @Prop({ trim: true })
  displayName?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ContactDocument = HydratedDocument<ContactEntity>;
export const ContactSchema = SchemaFactory.createForClass(ContactEntity);
